package com.example.piccrypt.services;

import com.example.piccrypt.exceptions.AccessDeniedException;
import com.example.piccrypt.exceptions.ResourceNotFoundException;
import com.example.piccrypt.models.User;
import com.example.piccrypt.repositories.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public String register(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);
        return jwtService.generateToken(user.getId(), user.getUsername());
    }

    public String login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (passwordEncoder.matches(password, user.getPassword())) {
            return jwtService.generateToken(user.getId(), user.getUsername());
        } else {
            throw new AccessDeniedException("Invalid password");
        }
    }
}
