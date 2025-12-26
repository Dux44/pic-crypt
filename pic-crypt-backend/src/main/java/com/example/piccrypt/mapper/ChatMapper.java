package com.example.piccrypt.mapper;

import com.example.piccrypt.dtos.ChatDto;
import com.example.piccrypt.models.Chat;
import org.mapstruct.*;

@Mapper(componentModel = "spring", uses = {ChatMemberMapper.class})
public interface ChatMapper {

    @Mapping(target = "members", ignore = true)
    Chat toEntity(ChatDto dto);

    @Mapping(source = "groupInfo.title", target = "title")
    @Mapping(source = "groupInfo.description", target = "description")
    @Mapping(source = "groupInfo.avatarUrl", target = "avatarUrl")
    @Mapping(source = "groupInfo.allowInvites", target = "allowInvites")
    @Mapping(source = "members", target = "members", qualifiedByName = "memberDto")
    ChatDto toDto(Chat entity);

}