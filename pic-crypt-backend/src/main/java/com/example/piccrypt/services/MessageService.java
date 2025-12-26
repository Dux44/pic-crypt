package com.example.piccrypt.services;

import com.example.piccrypt.dtos.MessageDto;
import com.example.piccrypt.dtos.UserStatusDto;
import com.example.piccrypt.exceptions.GeneralException;
import com.example.piccrypt.exceptions.ResourceNotFoundException;
import com.example.piccrypt.mapper.MessageMapper;
import com.example.piccrypt.models.Message;
import com.example.piccrypt.repositories.ChatRepository;
import com.example.piccrypt.repositories.MessageRepository;
import com.example.piccrypt.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MessageService {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ChatRepository chatRepository;
    private final MessageMapper messageMapper;
    private final ChatAuthorizationService chatAuth;


    public MessageService(SimpMessagingTemplate messagingTemplate,
                          MessageRepository messageRepository,
                          UserRepository userRepository,
                          ChatRepository chatRepository,
                          MessageMapper messageMapper,
                          ChatAuthorizationService chatAuth) {
        this.messagingTemplate = messagingTemplate;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.chatRepository = chatRepository;
        this.messageMapper = messageMapper;
        this.chatAuth = chatAuth;
    }

    // ---------- SEND MESSAGES ----------
    public void sendGroupMessage(MessageDto msg) {
        String topic = "/topic/chat." + msg.getChatId();
        messagingTemplate.convertAndSend(topic, msg);
    }

    // ---------- PRESENCE TO FRIENDS ----------
    public void broadcastUserStatus(UserStatusDto status) {
        // Minimal presence broadcast: publish to shared topic
        messagingTemplate.convertAndSend("/topic/presence", status);
    }

    public List<MessageDto> getMessagesByChatId(Long id) {
        List<Message> messages = messageRepository.findByChat_Id(id);
        return  messages.stream().map(messageMapper::toDto).collect(Collectors.toList());
    }

    public MessageDto addMessage(MessageDto messageDto) {
        Message message = messageMapper.toEntity(messageDto);
        message.setSender(userRepository.findById(messageDto.getSenderId()).orElseThrow(() -> new ResourceNotFoundException("User not found")));
        message.setChat(chatRepository.findById(messageDto.getChatId()).orElseThrow(() -> new ResourceNotFoundException("Chat not found")));
        messageRepository.save(message);
        return  messageMapper.toDto(message);
    }

    public MessageDto updateMessage(Long id, MessageDto messageDto) {
        Message message = messageRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        chatAuth.isOwner(message);

        messageMapper.updateEntityFromDto(messageDto, message);
        return  messageMapper.toDto(messageRepository.save(message));
    }

    public void deleteMessage(Long id) {
        Message message = messageRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        chatAuth.isOwner(message);

        messageRepository.delete(message);
    }



}
