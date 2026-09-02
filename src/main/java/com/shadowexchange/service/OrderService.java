package com.shadowexchange.service;

import com.shadowexchange.dto.OrderRequestDTO;
import com.shadowexchange.dto.UserResponse;
import com.shadowexchange.entity.Order;
import com.shadowexchange.entity.Stock;
import com.shadowexchange.entity.User;
import com.shadowexchange.repository.OrderRepository;
import com.shadowexchange.repository.StockRepository;
import com.shadowexchange.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final StockRepository stockRepository;

    public OrderService(
            OrderRepository orderRepository,
            UserRepository userRepository,
            StockRepository stockRepository) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.stockRepository = stockRepository;
    }

    public Order saveOrder(Order order) {
        return orderRepository.save(order);
    }

    public Order createOrder(OrderRequestDTO orderRequestDTO){
        User user = userRepository.findById(orderRequestDTO.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Stock stock = stockRepository.findById(orderRequestDTO.getStockId())
                .orElseThrow(() -> new RuntimeException("Stock not found"));

        Order order = new Order(
                user,
                stock,
                orderRequestDTO.getPrice(),
                orderRequestDTO.getQuantity(),
                orderRequestDTO.getType()
        );
        return orderRepository.save(order);
    }
}
