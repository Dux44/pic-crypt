package com.example.piccrypt.repositories;

import com.example.piccrypt.models.Friend;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FriendRepository extends JpaRepository<Friend, Long> {

    List<Friend> findByUser_Id(Long userId);

    Friend findByUser_IdAndFriend_Id(Long userId, Long friendId);

}