package com.example.piccrypt.controllers;

import com.example.piccrypt.dtos.*;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.util.HtmlUtils;

import java.security.Principal;
import java.util.Map;

@Controller
public class RealtimeController {

    private final SimpMessagingTemplate messaging;

    public RealtimeController(SimpMessagingTemplate messaging) {
        this.messaging = messaging;
    }

    /**
     * Generic router for realtime events
     * Incoming destination: /app/{entity}/{action}
     * Broadcast: /topic/{entity}
     */
    @MessageMapping("{entity}/{action}")
    public void route(
            @DestinationVariable String entity,
            @DestinationVariable String action,
            Map<String, Object> data,
            Principal principal
    ) {
        String sender = principal != null ? principal.getName() : null;
        EventEnvelope envelope = new EventEnvelope(entity, action, data, sender);

        // Broadcast to entity topic (e.g., /topic/message)
        messaging.convertAndSend("/topic/" + entity, envelope);
    }
}