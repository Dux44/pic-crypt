package com.example.piccrypt.repositories;

import com.example.piccrypt.models.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ChatRepository extends JpaRepository<Chat, Long> {

    @Query("SELECT c FROM Chat c \n" +
           "WHERE c.isGroup = false \n" +
           "  AND SIZE(c.members) = 2 \n" +
           "  AND EXISTS (SELECT 1 FROM ChatMember cm1 WHERE cm1.chat = c AND cm1.member.id = :userId1) \n" +
           "  AND EXISTS (SELECT 1 FROM ChatMember cm2 WHERE cm2.chat = c AND cm2.member.id = :userId2)")
    Optional<Chat> findOneToOneChatBetween(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
}
