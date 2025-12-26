package com.example.piccrypt.models;

import com.example.piccrypt.types.SelfDestructType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "senderId")
    private User sender;

    @ManyToOne
    @JoinColumn(name = "chatId")
    private Chat chat;

    private String content;

    private String mediaUrl;

    private LocalDateTime createdAt = LocalDateTime.now();
    private Instant readAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SelfDestructType selfDestructType = SelfDestructType.NONE;
    private Instant viewedAt;
    private Instant expireAt;
    private int viewCount;

}
