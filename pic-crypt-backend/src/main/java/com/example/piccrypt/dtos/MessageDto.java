package com.example.piccrypt.dtos;

import com.example.piccrypt.types.SelfDestructType;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.LocalDateTime;

@Data
public class MessageDto {

    private Long id;

    private Long senderId;
    private Long chatId;

    private String content;

    private String mediaUrl;

    private LocalDateTime createdAt = LocalDateTime.now();
    private Instant readAt;

    private SelfDestructType selfDestructType = SelfDestructType.NONE;
    private Instant viewedAt;
    private Instant expireAt;
    private int viewCount;
}
