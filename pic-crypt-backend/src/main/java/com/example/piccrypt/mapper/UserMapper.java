package com.example.piccrypt.mapper;

import com.example.piccrypt.dtos.UserDto;
import com.example.piccrypt.models.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserDto toDto(User entity);
    User toEntity(UserDto dto);
}