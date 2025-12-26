package com.example.piccrypt.repositories;

import com.example.piccrypt.models.ChatMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatMemberRepository extends JpaRepository<ChatMember, Long> {
    List<ChatMember> findByMember_Id(Long userId);

    boolean existsByChat_IdAndMember_Id(Long chatId, Long memberId);
    Optional<ChatMember> findByChat_IdAndMember_Id(Long chatId, Long memberId);
}
