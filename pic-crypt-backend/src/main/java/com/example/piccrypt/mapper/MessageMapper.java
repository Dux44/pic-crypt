package com.example.piccrypt.mapper;

import com.example.piccrypt.dtos.MessageDto;
import com.example.piccrypt.models.Message;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface MessageMapper {

    @Mapping(target = "senderId", source = "sender.id")
    @Mapping(target = "chatId", source = "chat.id")
    MessageDto toDto(Message entity);

    @Mapping(target = "sender", ignore = true)
    @Mapping(target = "chat", ignore = true)
    Message toEntity(MessageDto dto);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "sender", ignore = true)
    @Mapping(target = "chat", ignore = true)
    void updateEntityFromDto(MessageDto dto, @MappingTarget Message entity);
}
