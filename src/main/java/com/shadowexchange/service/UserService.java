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
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class UserService {

    public static final BigDecimal MIN_DEMO_CASH = new BigDecimal("3000.00");
    public static final BigDecimal MAX_DEMO_CASH = new BigDecimal("35000.00");
    public static final int MIN_DEMO_HOLDINGS = 2;
    public static final int MAX_DEMO_HOLDINGS = 6;
    public static final int MIN_HOLDING_QUANTITY = 5;
    public static final int MAX_HOLDING_QUANTITY = 50;

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
        user.setAuthProvider(com.shadowexchange.entity.AuthProvider.LOCAL_DEMO);
        user.setIsDemo(false);

        return toResponse(userRepository.save(user));
    }

    /**
     * Creates a new demo account with randomized virtual cash and starter positions
     * within sensible, configurable bounds.
     * Cash precision uses scale 2 BigDecimal, and positions reference valid exchange stocks.
     */
    @Transactional
    public UserResponse createDemoUser() {
        User user = new User();
        user.setUsername("Shadow Demo Operator");
        user.setEmail("shadow-demo-" + UUID.randomUUID() + "@example.test");
        user.setPassword(UUID.randomUUID().toString());
        user.setAuthProvider(com.shadowexchange.entity.AuthProvider.LOCAL_DEMO);
        user.setIsDemo(true);

        long minCents = MIN_DEMO_CASH.movePointRight(2).longValueExact();
        long maxCents = MAX_DEMO_CASH.movePointRight(2).longValueExact();
        long randomCents = ThreadLocalRandom.current().nextLong(minCents, maxCents + 1);
        BigDecimal startingCash = BigDecimal.valueOf(randomCents, 2);

        user.setBalance(startingCash);
        user.setReservedBalance(BigDecimal.ZERO);
        User savedUser = userRepository.save(user);

        List<Stock> allStocks = stockRepository.findAll();
        if (!allStocks.isEmpty()) {
            List<Stock> shuffled = new ArrayList<>(allStocks);
            Collections.shuffle(shuffled);
            int targetHoldingsCount = Math.min(
                    shuffled.size(),
                    ThreadLocalRandom.current().nextInt(MIN_DEMO_HOLDINGS, MAX_DEMO_HOLDINGS + 1)
            );
            for (int i = 0; i < targetHoldingsCount; i++) {
                Stock stock = shuffled.get(i);
                int quantity = ThreadLocalRandom.current().nextInt(MIN_HOLDING_QUANTITY, MAX_HOLDING_QUANTITY + 1);
                holdingRepository.save(new Holding(savedUser, stock, quantity));
            }
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
                user.getReservedBalance(),
                user.getAuthProvider(),
                user.getAvatarUrl(),
                user.getIsDemo()
        );
    }
}
