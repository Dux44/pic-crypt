package com.example.piccrypt.dtos;

import lombok.Data;

import java.sql.Date;
import java.time.LocalDateTime;

@Data
public class UserDto {
    private Long id;
    private String username;
    private String email;
    private String password;
    private String bio;
    private String avatarUrl;
    private Date lastSeenAt;
    private LocalDateTime createdAt;
}
