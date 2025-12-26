package com.example.piccrypt.dtos;

import com.example.piccrypt.types.ChatRole;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ChatMemberDto {

    private Long id;
    private Long chatId;
    private Long memberId;
    private ChatRole role = ChatRole.MEMBER;
    private String username;
    private String avatarUrl;
    private String bio;
    private LocalDateTime joinedAt;
}
