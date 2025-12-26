package com.example.piccrypt.controllers;

import com.example.piccrypt.dtos.AuthRequest;
import com.example.piccrypt.dtos.AuthResponse;
import com.example.piccrypt.dtos.UserDto;
import com.example.piccrypt.models.User;
import com.example.piccrypt.services.AuthService;
import com.example.piccrypt.services.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    public AuthController(AuthService userService, UserService userService1) {
        this.authService = userService;
        this.userService = userService1;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody AuthRequest request) {
        UserDto userDto = new UserDto();
        userDto.setEmail(request.getEmail());
        userDto.setUsername(request.getUsername());
        userDto.setPassword(request.getPassword());
        User user = userService.createUser(userDto);
        return ResponseEntity.status(HttpStatus.OK).body(new AuthResponse(authService.register(user)));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        return ResponseEntity.status(HttpStatus.OK).body(new AuthResponse(authService.login(request.getUsername(), request.getPassword())));
    }

}
