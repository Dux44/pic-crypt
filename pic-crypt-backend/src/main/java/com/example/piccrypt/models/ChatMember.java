package com.example.piccrypt.models;

import com.example.piccrypt.types.ChatRole;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(
        name = "chatMembers",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"chatId", "memberId"}
        )
)
public class ChatMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chatId", nullable = false)
    private Chat chat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "memberId", nullable = false)
    private User member;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChatRole role = ChatRole.MEMBER;

    @Column(nullable = false)
    private LocalDateTime joinedAt = LocalDateTime.now();
}
