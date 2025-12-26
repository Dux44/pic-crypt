package com.example.piccrypt.services;

import com.example.piccrypt.config.CustomUserDetails;
import com.example.piccrypt.dtos.UserDto;
import com.example.piccrypt.exceptions.AlreadyExistsException;
import com.example.piccrypt.exceptions.GeneralException;
import com.example.piccrypt.models.User;
import com.example.piccrypt.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;
import java.util.UUID;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final Path avatarDir;
    private final String defaultAvatarUrl;
    private final String avatarBaseUrl;
    private final PasswordEncoder passwordEncoder;

    public CustomUserDetails getCurrentUserDetails() {
        return (CustomUserDetails) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
    }

    public User getCurrentUser() {
        Long id = getCurrentUserDetails().getId();
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
    
    public UserService(UserRepository userRepository,
                       @Value("${app.avatars.dir}") String avatarDir,
                       @Value("${app.avatars.default}") String defaultAvatarPath,
                       @Value("${app.avatars.base-url:/static/avatars/}") String avatarBaseUrl, PasswordEncoder passwordEncoder) throws IOException {
        this.userRepository = userRepository;
        this.avatarDir = Paths.get(avatarDir);
        this.avatarBaseUrl = avatarBaseUrl.endsWith("/") ? avatarBaseUrl : avatarBaseUrl + "/";
        this.passwordEncoder = passwordEncoder;
        String fileName = Paths.get(defaultAvatarPath).getFileName().toString();
        this.defaultAvatarUrl = defaultAvatarPath.startsWith("/")
                ? defaultAvatarPath
                : this.avatarBaseUrl + fileName;
        Files.createDirectories(this.avatarDir);
    }

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<UserDto> searchUsers(String query) {
        return userRepository.findByUsernameContainingIgnoreCase(query).stream().map(this::toDto).collect(Collectors.toList());
    }

    public UserDto getUserById() {
        User user = getCurrentUser();
        return toDto(user);
    }

    public User getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user;
    }


    public User createUser(UserDto dto) {
        User user = fromDto(dto);

        if (user.getAvatarUrl() == null || user.getAvatarUrl().isBlank()) {
            user.setAvatarUrl(defaultAvatarUrl);
        }

        if (userRepository.existsByUsername(user.getUsername())) {
            throw new AlreadyExistsException("Username already taken");
        }

        if (userRepository.existsByEmail(user.getEmail())) {
            throw new AlreadyExistsException("Email already taken");
        }

        return user;
    }

    public UserDto patchUser(UserDto updates) {
        User user = getCurrentUser();

        if (hasChanged(user.getUsername(), updates.getUsername())) {
            if (userRepository.existsByUsername(updates.getUsername())) {
                throw new AlreadyExistsException("Username already taken");
            }
            user.setUsername(updates.getUsername());
        }

        if (hasChanged(user.getEmail(), updates.getEmail())) {
            if (userRepository.existsByEmail(updates.getEmail())) {
                throw new AlreadyExistsException("Email already taken");
            }
            user.setEmail(updates.getEmail());
        }

        if (updates.getBio() != null) {
            user.setBio(updates.getBio());
        }

        if (updates.getPassword() != null && !updates.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(updates.getPassword()));
        }

        return toDto(userRepository.save(user));
    }

    public UserDto patchUserAvatar(MultipartFile avatarFile) {
        User user = getCurrentUser();

        if (avatarFile == null || avatarFile.isEmpty()) {
            throw new GeneralException(HttpStatus.BAD_REQUEST, "Avatar file is empty");
        }

        user.setAvatarUrl(storeAvatar(avatarFile));

        return toDto(userRepository.save(user));
    }

    public void deleteUser() {
        User user = getCurrentUser();
        userRepository.delete(user);
    }

    private UserDto toDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setBio(user.getBio());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setLastSeenAt(user.getLastSeenAt());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }

    private User fromDto(UserDto dto) {
        User user = new User();
        user.setId(dto.getId());
        user.setUsername(dto.getUsername());
        user.setPassword(dto.getPassword());
        user.setEmail(dto.getEmail());
        user.setBio(dto.getBio());
        user.setAvatarUrl(dto.getAvatarUrl());
        user.setLastSeenAt(dto.getLastSeenAt());
        user.setCreatedAt(dto.getCreatedAt());
        return user;
    }

    private boolean hasChanged(String current, String updated) {
        return updated != null && !updated.equals(current);
    }

    private String storeAvatar(MultipartFile file) {
        try {
            String original = file.getOriginalFilename();
            String ext = "";
            if (original.lastIndexOf('.') != -1) {
                ext = original.substring(original.lastIndexOf('.')).toLowerCase();
            }
            if (!(ext.equals(".png") || ext.equals(".jpg") || ext.equals(".jpeg") || ext.equals(".gif"))) {
                throw new GeneralException(HttpStatus.BAD_REQUEST, "Only .png, .jpg, .jpeg, .gif images are allowed");
            }
            String filename = UUID.randomUUID() + ext;
            Path target = avatarDir.resolve(filename);
            Files.copy(file.getInputStream(), target);
            return avatarBaseUrl + filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store avatar", e);
        }
    }
}
