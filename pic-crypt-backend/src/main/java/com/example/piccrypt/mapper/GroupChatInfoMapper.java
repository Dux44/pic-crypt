package com.example.piccrypt.mapper;

import com.example.piccrypt.dtos.ChatDto;
import com.example.piccrypt.models.GroupChatInfo;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface GroupChatInfoMapper {

    @Mapping(source = "title", target = "title")
    @Mapping(source = "avatarUrl", target = "avatarUrl")
    @Mapping(source = "description", target = "description")
    @Mapping(source = "allowInvites", target = "allowInvites")
    void update(@MappingTarget ChatDto dto, GroupChatInfo info);
}