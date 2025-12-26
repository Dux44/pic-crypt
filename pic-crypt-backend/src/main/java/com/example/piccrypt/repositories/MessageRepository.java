package com.example.piccrypt.repositories;

import com.example.piccrypt.models.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    public List<Message> findByChat_Id(Long id);
}
