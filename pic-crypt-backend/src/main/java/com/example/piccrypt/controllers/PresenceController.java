package com.example.piccrypt.controllers;


import com.example.piccrypt.dtos.UserStatusDto;
import com.example.piccrypt.services.MessageService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

@Controller
public class PresenceController {

    private final MessageService messagingService;

    public PresenceController(MessageService messagingService) {
        this.messagingService = messagingService;
    }

    @MessageMapping("/status")
    public void userStatus(UserStatusDto status) {
        messagingService.broadcastUserStatus(status);
    }
}
