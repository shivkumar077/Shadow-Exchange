package com.shadowexchange.service;

import com.shadowexchange.dto.CreateUserRequest;
import com.shadowexchange.dto.UserResponse;
import com.shadowexchange.entity.Holding;
import com.shadowexchange.entity.Stock;
import com.shadowexchange.entity.User;
import com.shadowexchange.repository.HoldingRepository;
import com.shadowexchange.repository.StockRepository;
import com.shadowexchange.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final StockRepository stockRepository;
    private final HoldingRepository holdingRepository;

    public UserService(
            UserRepository userRepository,
            StockRepository stockRepository,
            HoldingRepository holdingRepository) {
        this.userRepository = userRepository;
        this.stockRepository = stockRepository;
        this.holdingRepository = holdingRepository;
    }

    public UserResponse createUser(CreateUserRequest request) {
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setBalance(new BigDecimal("10000.00"));
        user.setReservedBalance(BigDecimal.ZERO);

        return toResponse(userRepository.save(user));
    }

    /**
     * Creates a local-only demo account with virtual cash and starter positions
     * so both BUY and SELL workflows can be exercised in the simulator.
     */
    @Transactional
    public UserResponse createDemoUser() {
        User user = new User();
        user.setUsername("Shadow Demo Operator");
        user.setEmail("shadow-demo-" + UUID.randomUUID() + "@example.test");
        user.setPassword(UUID.randomUUID().toString());
        user.setBalance(new BigDecimal("10000.00"));
        user.setReservedBalance(BigDecimal.ZERO);
        User savedUser = userRepository.save(user);

        List<Stock> stocks = stockRepository.findAll();
        for (Stock stock : stocks) {
            holdingRepository.save(new Holding(savedUser, stock, 100));
        }

        return toResponse(savedUser);
    }

    public UserResponse getUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toResponse(user);
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getBalance(),
                user.getReservedBalance()
        );
    }
}
