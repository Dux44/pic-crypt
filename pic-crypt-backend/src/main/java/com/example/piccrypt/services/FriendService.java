package com.example.piccrypt.services;

import com.example.piccrypt.dtos.FriendDto;
import com.example.piccrypt.dtos.UserDto;
import com.example.piccrypt.exceptions.AlreadyExistsException;
import com.example.piccrypt.exceptions.ResourceNotFoundException;
import com.example.piccrypt.mapper.ChatMemberMapper;
import com.example.piccrypt.mapper.UserMapper;
import com.example.piccrypt.models.Friend;
import com.example.piccrypt.models.User;
import com.example.piccrypt.repositories.FriendRepository;
import com.example.piccrypt.repositories.UserRepository;
import com.sun.tools.jconsole.JConsoleContext;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class FriendService {

    private final FriendRepository friendRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final UserMapper userMapper;


    public FriendService(FriendRepository friendRepository, UserRepository userRepository, UserService userService, UserMapper userMapper) {
        this.friendRepository = friendRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.userMapper = userMapper;
    }

    public List<UserDto> getFriendDtosByUserId() {
        User user = userService.getCurrentUser();
        List<Friend> friends = friendRepository.findByUser_Id(user.getId());

        return friends.stream()
                .map(f -> {
                    User friendUser = userService.getUserById(f.getFriend().getId());
                    return userMapper.toDto(friendUser);
                })
                .toList();
    }

    public UserDto addFriend(Long friendId) {
        User user = userService.getCurrentUser();
        User friendUser = userRepository.findById(friendId)
                .orElseThrow(() -> new ResourceNotFoundException("Friend not found"));

        if (Objects.equals(user.getId(), friendUser.getId())) {
            throw new IllegalArgumentException("User can't add himself as a friend");
        }

        if (friendRepository.findByUser_IdAndFriend_Id(user.getId(), friendId) == null) {
            Friend newFriend = new Friend();
            newFriend.setUser(user);
            newFriend.setFriend(friendUser);
            friendRepository.save(newFriend);
            return userMapper.toDto(friendUser);
        } else {
            throw new AlreadyExistsException("Friend relationship already exists");
        }
    }

    public void deleteFriend(Long friendId) {
        User user = userService.getCurrentUser();
        Friend friend = friendRepository.findByUser_IdAndFriend_Id(user.getId(), friendId);

        if (friend == null) {
            throw new ResourceNotFoundException("Friend relationship not found");
        }

        friendRepository.delete(friend);
    }

}
