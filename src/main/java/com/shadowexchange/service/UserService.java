package com.shadowexchange.service;


import com.shadowexchange.dto.CreateUserRequest;
import com.shadowexchange.dto.UserResponse;
import com.shadowexchange.entity.User;
import com.shadowexchange.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserResponse createUser(CreateUserRequest request) {

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setBalance(new BigDecimal(10000.00));
        user.setReservedBalance(BigDecimal.ZERO);

        User savedUser = userRepository.save(user);
        return new UserResponse(
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getEmail(),
                savedUser.getBalance(),
                savedUser.getReservedBalance()
        );
    }

    public UserResponse getUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getBalance(),
                user.getReservedBalance()
        );
    }
}
