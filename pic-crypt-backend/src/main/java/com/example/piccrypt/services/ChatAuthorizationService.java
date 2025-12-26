package com.example.piccrypt.services;

import com.example.piccrypt.models.Chat;
import com.example.piccrypt.models.Message;
import com.example.piccrypt.repositories.MessageRepository;
import com.example.piccrypt.types.ChatRole;
import com.example.piccrypt.models.User;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
public class ChatAuthorizationService {

    private final UserService userService;

    public ChatAuthorizationService(UserService userService) {
        this.userService = userService;
    }

    public boolean isOwner(Chat chat) {
        User current = userService.getCurrentUser();
        return chat.getMembers().stream()
                .anyMatch(m ->
                        m.getMember().getId().equals(current.getId()) &&
                                m.getRole() == ChatRole.OWNER
                );
    }

    public boolean isOwner(Message message) {
        User current = userService.getCurrentUser();
        return Objects.equals(message.getSender().getId(), current.getId());
    }

    public boolean isSelf(Long userId) {
        return userService.getCurrentUser().getId().equals(userId);
    }

    public void requireOwner(Chat chat) {
        if (!isOwner(chat)) {
            throw new AccessDeniedException("Only the chat owner can perform this action");
        }
    }

    public void requireOwnerOrSelf(Chat chat, Long targetUserId) {
        if (!isOwner(chat) && !isSelf(targetUserId)) {
            throw new AccessDeniedException("Not allowed to perform this action");
        }
    }
}