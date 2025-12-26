package com.example.piccrypt.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "groupChatInfo")
public class GroupChatInfo {

    @Id
    private Long chatId;

    private String title;

    private String avatarUrl;

    @OneToOne
    @MapsId
    @JoinColumn(name = "chatId")
    private Chat chat;

    private String description;
    private Boolean allowInvites;
}
