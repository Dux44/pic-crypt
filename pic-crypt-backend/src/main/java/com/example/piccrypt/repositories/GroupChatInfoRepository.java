package com.example.piccrypt.repositories;

import com.example.piccrypt.models.GroupChatInfo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroupChatInfoRepository extends JpaRepository<GroupChatInfo, Long> {
}
