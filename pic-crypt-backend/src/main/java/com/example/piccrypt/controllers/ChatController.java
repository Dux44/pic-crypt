package com.example.piccrypt.controllers;

import com.example.piccrypt.dtos.ChatDto;
import com.example.piccrypt.dtos.ChatMemberDto;
import com.example.piccrypt.dtos.MessageDto;
import com.example.piccrypt.dtos.UserDto;
import com.example.piccrypt.models.Chat;
import com.example.piccrypt.services.ChatService;
import com.example.piccrypt.services.MessageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/chats")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/user")
    public ResponseEntity<List<ChatDto>> getChatsByUser() {
        List<ChatDto> chats = chatService.getChats();
        return ResponseEntity.ok(chats);
    }

    @GetMapping("/user/{friendId}")
    public ResponseEntity<ChatDto> getChatsByUsers(@PathVariable Long friendId) {
        ChatDto chat = chatService.getChat(friendId);
        return ResponseEntity.ok(chat);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChatDto> getChatById(@PathVariable Long id) {
        ChatDto chat = chatService.getChatById(id);
        return ResponseEntity.ok(chat);
    }

    @PostMapping
    public ResponseEntity<ChatDto> createChat(@RequestBody ChatDto chat) {
        return ResponseEntity.ok(chatService.createChat(chat));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChatDto> updateChat(@PathVariable Long id, @RequestBody ChatDto chat) {
        return ResponseEntity.ok(chatService.updateChat(id, chat));
    }

    @PatchMapping(value = "/{id}/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ChatDto> patchChatAvatar(@PathVariable Long id,
            @RequestPart("avatar") MultipartFile avatar) {
        ChatDto updatedChat = chatService.patchChatAvatar(id, avatar);
        return ResponseEntity.ok(updatedChat);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteChat(@PathVariable Long id) {
        chatService.deleteChat(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<ChatMemberDto> addMember(@PathVariable Long id, @RequestBody ChatMemberDto memberDto) {
        ChatMemberDto chatMember =  chatService.addMember(id, memberDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(chatMember);
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable Long id, @PathVariable Long userId) {
        chatService.removeMember(id, userId);
        return ResponseEntity.noContent().build();
    }
}
