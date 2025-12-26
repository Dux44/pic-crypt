package com.example.piccrypt.services;

import com.example.piccrypt.dtos.ChatDto;
import com.example.piccrypt.dtos.ChatMemberDto;
import com.example.piccrypt.exceptions.GeneralException;
import com.example.piccrypt.exceptions.ResourceNotFoundException;
import com.example.piccrypt.mapper.ChatMapper;
import com.example.piccrypt.mapper.ChatMemberMapper;
import com.example.piccrypt.models.Chat;
import com.example.piccrypt.models.ChatMember;
import com.example.piccrypt.models.GroupChatInfo;
import com.example.piccrypt.models.User;
import com.example.piccrypt.repositories.ChatMemberRepository;
import com.example.piccrypt.repositories.ChatRepository;
import com.example.piccrypt.repositories.GroupChatInfoRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ChatService {

    private final ChatRepository chatRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final GroupChatInfoRepository groupChatInfoRepository;
    private final UserService userService;
    private final ChatAuthorizationService chatAuth;
    private final ChatMapper chatMapper;
    private final ChatMemberMapper chatMemberMapper;
    private final Path avatarDir;
    private final String defaultAvatarUrl;
    private final String avatarBaseUrl;

    public ChatService(ChatRepository chatRepository,
                       ChatMemberRepository chatMemberRepository,
                       GroupChatInfoRepository groupChatInfoRepository,
                       UserService userService,
                       ChatAuthorizationService chatAuth,
                       ChatMapper chatMapper,
                       ChatMemberMapper chatMemberMapper,
                       @Value("${app.avatars.dir}") String avatarDir,
                       @Value("${app.chatAvatar.default}") String defaultAvatarPath,
                       @Value("${app.avatars.base-url:/static/avatars/}") String avatarBaseUrl) throws IOException {
        this.chatRepository = chatRepository;
        this.chatMemberRepository = chatMemberRepository;
        this.groupChatInfoRepository = groupChatInfoRepository;
        this.userService = userService;
        this.chatAuth = chatAuth;
        this.chatMapper = chatMapper;
        this.chatMemberMapper = chatMemberMapper;
        this.avatarDir = Paths.get(avatarDir);
        this.avatarBaseUrl = avatarBaseUrl.endsWith("/") ? avatarBaseUrl : avatarBaseUrl + "/";
        String fileName = Paths.get(defaultAvatarPath).getFileName().toString();
        this.defaultAvatarUrl = defaultAvatarPath.startsWith("/")
                ? defaultAvatarPath
                : this.avatarBaseUrl + fileName;
        Files.createDirectories(this.avatarDir);
    }

    public List<ChatDto> getChats() {
        User user = userService.getCurrentUser();

        return chatMemberRepository
                .findByMember_Id(user.getId())
                .stream()
                .map(ChatMember::getChat)
                .map(chatMapper::toDto)
                .toList();
    }

    public ChatDto getChat(Long otherUserId) {
        User user = userService.getCurrentUser();
        User otherUser = userService.getUserById(otherUserId);

        Chat chat = chatRepository.findOneToOneChatBetween(user.getId(), otherUser.getId())
                .or(() -> chatRepository.findOneToOneChatBetween(user.getId(), otherUser.getId())).orElseThrow(() -> new ResourceNotFoundException("Chat not found"));

        return chatMapper.toDto(chat);
    }

    public ChatDto getChatById(Long id) {
        Chat chat = chatRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Chat not found"));
        return chatMapper.toDto(chat);
    }

    @Transactional
    public ChatDto createChat(ChatDto chatDto) {
        Chat chat = chatMapper.toEntity(chatDto);
        if (!chat.isGroup() && chatDto.getMembers() != null && chatDto.getMembers().length == 2) {
            Long userId1 = chatDto.getMembers()[0].getMemberId();
            Long userId2 = chatDto.getMembers()[1].getMemberId();

            if (userId1 != null && userId2 != null) {
                Optional<Chat> existing = chatRepository.findOneToOneChatBetween(userId1, userId2)
                        .or(() -> chatRepository.findOneToOneChatBetween(userId2, userId1));
                if (existing.isPresent()) {
                    return chatMapper.toDto(existing.get());
                }
            }
        }
        if (chat.isGroup()) {
            GroupChatInfo info = new GroupChatInfo();
            info.setChat(chat);
            info.setTitle(chatDto.getTitle());
            info.setAvatarUrl(defaultAvatarUrl);
            info.setDescription(chatDto.getDescription());
            info.setAllowInvites(chatDto.getAllowInvites() != null
                    ? chatDto.getAllowInvites()
                    : false);
            groupChatInfoRepository.saveAndFlush(info);
            chat.setGroupInfo(info);
        }

        chat = chatRepository.saveAndFlush(chat);
        if (chatDto.getMembers() != null) {
            for (ChatMemberDto m : chatDto.getMembers()) {
                ChatMember member = new ChatMember();
                member.setChat(chat);
                member.setRole(m.getRole());
                member.setJoinedAt(LocalDateTime.now());
                User user = userService.getUserById(m.getMemberId());
                member.setMember(user);

                chatMemberRepository.saveAndFlush(member);
                chat.getMembers().add(member);
            }
        }

        chat = chatRepository.findById(chat.getId()).orElseThrow();
        return chatMapper.toDto(chat);
    }

    @Transactional
    public ChatDto updateChat(Long id, ChatDto updates) {
        Chat chat = chatRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));

        chatAuth.isOwner(chat);

        if (chat.isGroup() && chat.getGroupInfo() != null) {
            GroupChatInfo info = chat.getGroupInfo();

            if (updates.getTitle() != null) info.setTitle(updates.getTitle());
            if (updates.getAvatarUrl() != null) info.setAvatarUrl(updates.getAvatarUrl());
            if (updates.getDescription() != null) info.setDescription(updates.getDescription());
            if (updates.getAllowInvites() != null) info.setAllowInvites(updates.getAllowInvites());
            groupChatInfoRepository.saveAndFlush(info);
        }

        chat = chatRepository.save(chat);
        return chatMapper.toDto(chat);
    }

    public ChatDto patchChatAvatar(Long id, MultipartFile avatarFile) {
        Chat chat = chatRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));

        if (avatarFile == null || avatarFile.isEmpty()) {
            throw new GeneralException(HttpStatus.BAD_REQUEST, "Avatar file is empty");
        }

        if (chat.isGroup() && chat.getGroupInfo() != null) {
            GroupChatInfo info = chat.getGroupInfo();
            info.setAvatarUrl(storeAvatar(avatarFile));
            groupChatInfoRepository.saveAndFlush(info);
        }

        chat = chatRepository.save(chat);
        return chatMapper.toDto(chat);
    }

    public void deleteChat(Long id) {
        Chat chat = chatRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));

        chatAuth.isOwner(chat);

        chatRepository.delete(chat);
    }

    @Transactional
    public ChatMemberDto addMember(Long chatId, ChatMemberDto memberDto) {
        Chat chat = chatRepository.findById(chatId).orElseThrow(() -> new ResourceNotFoundException("Chat not found"));

        if (!chat.isGroup()) {
            throw new IllegalArgumentException("Can't add members to private chats");
        }

        chatAuth.isOwner(chat);

        Long memberId = memberDto.getMemberId();
        if (chatMemberRepository.existsByChat_IdAndMember_Id(chatId, memberId)) {
            return chatMemberRepository
                    .findByChat_IdAndMember_Id(chatId, memberId)
                    .map(chatMemberMapper::toMemberDto)
                    .orElseThrow();
        }

        User member = userService.getUserById(memberDto.getMemberId());

        ChatMember chatMember = new ChatMember();
        chatMember.setChat(chat);
        chatMember.setMember(member);
        chatMember.setRole(memberDto.getRole());
        chatMember = chatMemberRepository.save(chatMember);
        return chatMemberMapper.toMemberDto(chatMember);
    }

    @Transactional
    public void removeMember(Long chatId, Long userId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));

        if (!chat.isGroup()) {
            throw new IllegalArgumentException("Can't remove members from private chats");
        }

        chatAuth.requireOwnerOrSelf(chat, userId);

        ChatMember member = chatMemberRepository.findByChat_IdAndMember_Id(chatId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat member not found"));

        chat.getMembers().remove(member);
        chatMemberRepository.delete(member);
        chatMemberRepository.flush();
    }

    private String storeAvatar(MultipartFile file) {
        try {
            String original = file.getOriginalFilename();
            String ext = "";
            if (original.lastIndexOf('.') != -1) {
                ext = original.substring(original.lastIndexOf('.')).toLowerCase();
            }
            if (!(ext.equals(".png") || ext.equals(".jpg") || ext.equals(".jpeg") || ext.equals(".gif"))) {
                throw new GeneralException(HttpStatus.BAD_REQUEST, "Only .png, .jpg, .jpeg, .gif images are allowed");
            }
            String filename = UUID.randomUUID() + ext;
            Path target = avatarDir.resolve(filename);
            Files.copy(file.getInputStream(), target);
            return avatarBaseUrl + filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store avatar", e);
        }
    }

}
