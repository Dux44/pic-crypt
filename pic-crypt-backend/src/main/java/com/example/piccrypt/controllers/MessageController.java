package com.example.piccrypt.controllers;

import com.example.piccrypt.dtos.MessageDto;
import com.example.piccrypt.services.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @MessageMapping("/send")
    public void receiveMessage(MessageDto message) {
        messageService.sendGroupMessage(message);
    }

    @GetMapping("/{id}")
    public ResponseEntity<List<MessageDto>> getMessagesByChat(@PathVariable Long id) {
        List<MessageDto> messages = messageService.getMessagesByChatId(id);
        return ResponseEntity.ok(messages);
    }

    @PostMapping
    public ResponseEntity<MessageDto> createMessage(@RequestBody MessageDto messageDto) {
        return ResponseEntity.ok(messageService.addMessage(messageDto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MessageDto> updateMessage(@PathVariable Long id, @RequestBody MessageDto messageDto) {
        return ResponseEntity.ok(messageService.updateMessage(id, messageDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMessage(@PathVariable Long id) {
        messageService.deleteMessage(id);
        return ResponseEntity.noContent().build();
    }

}
