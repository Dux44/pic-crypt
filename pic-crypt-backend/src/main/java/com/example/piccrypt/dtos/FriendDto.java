package com.example.piccrypt.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class FriendDto {
    private Long id;
    private Long userId;
    private Long friendId;
    private String username;
    private String avatarUrl;
}
