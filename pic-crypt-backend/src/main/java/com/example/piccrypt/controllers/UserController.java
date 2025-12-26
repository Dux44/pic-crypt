package com.example.piccrypt.controllers;

import com.example.piccrypt.dtos.UserDto;
import com.example.piccrypt.services.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers(@RequestParam(value = "username", required = false) String username) {
        List<UserDto> users;

        if (username != null && !username.isEmpty()) {
            users = userService.searchUsers(username);
        } else {
            users = userService.getAllUsers();
        }
        return ResponseEntity.ok(users);
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getUserById() {
        UserDto user = userService.getUserById();
        return ResponseEntity.status(HttpStatus.OK).body(user);
    }

//    @PostMapping
//    public ResponseEntity<UserDto> createUser(@RequestBody UserDto user) {
//        return ResponseEntity.ok(userService.createUser(user));
//    }

    @PatchMapping("/me")
    public ResponseEntity<UserDto> patchUserFields(
            @RequestBody UserDto updates) {
        UserDto updatedUser = userService.patchUser(updates);
        return ResponseEntity.ok(updatedUser);
    }

    @PatchMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserDto> patchUserAvatar(
            @RequestPart("avatar") MultipartFile avatar) {
        UserDto updatedUser = userService.patchUserAvatar(avatar);
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteUser() {
        userService.deleteUser();
        return ResponseEntity.noContent().build();
    }

}
