package com.example.piccrypt.mapper;

import com.example.piccrypt.dtos.ChatMemberDto;
import com.example.piccrypt.models.ChatMember;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface ChatMemberMapper {

    @Mapping(source = "chat.id", target = "chatId")
    @Mapping(source = "member.id", target = "memberId")
    @Mapping(source = "member.username", target = "username")
    @Mapping(source = "member.avatarUrl", target = "avatarUrl")
    @Mapping(source = "member.bio", target = "bio")
    @Mapping(source = "role", target = "role")
    @Mapping(source = "joinedAt", target = "joinedAt")
    ChatMemberDto toDto(ChatMember entity);

    @Named("memberDto")
    @Mapping(source = "chat.id", target = "chatId")
    @Mapping(source = "member.id", target = "memberId")
    @Mapping(source = "member.username", target = "username")
    @Mapping(source = "member.avatarUrl", target = "avatarUrl")
    @Mapping(source = "member.bio", target = "bio")
    @Mapping(source = "role", target = "role")
    @Mapping(source = "joinedAt", target = "joinedAt")
    ChatMemberDto toMemberDto(ChatMember chatMember);

}