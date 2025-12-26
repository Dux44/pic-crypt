package com.example.piccrypt.controllers;

import com.example.piccrypt.dtos.FriendDto;
import com.example.piccrypt.dtos.UserDto;
import com.example.piccrypt.models.Friend;
import com.example.piccrypt.services.FriendService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/friends")
public class FriendController {

    private final FriendService friendService;

    public FriendController(FriendService friendService) {
        this.friendService = friendService;
    }

    @GetMapping
    public List<UserDto> getFriends() {
        return friendService.getFriendDtosByUserId();
    }

    @PostMapping
    public ResponseEntity<UserDto> addFriend(@RequestBody FriendDto friendDto) {
        UserDto friend = friendService.addFriend(friendDto.getFriendId());
        return ResponseEntity.status(HttpStatus.CREATED).body(friend);

    }

    @DeleteMapping("/{friendId}")
    public ResponseEntity<Void> deleteFriend(@PathVariable Long friendId) {
        friendService.deleteFriend(friendId);
        return ResponseEntity.noContent().build();
    }
}
