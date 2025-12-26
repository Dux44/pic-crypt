package com.example.piccrypt.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class ChatDto {
    private Long id;
    @JsonProperty("isGroup")
    private boolean isGroup;
    private ChatMemberDto[] members;

    private String title;
    private String avatarUrl;
    private String description;
    private Boolean allowInvites;
}
