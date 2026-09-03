package com.shadowexchange.service;

import com.shadowexchange.dto.OrderRequestDTO;
import com.shadowexchange.dto.OrderResponseDTO;
import com.shadowexchange.dto.UserResponse;
import com.shadowexchange.entity.Order;
import com.shadowexchange.entity.Stock;
import com.shadowexchange.entity.User;
import com.shadowexchange.repository.OrderRepository;
import com.shadowexchange.repository.StockRepository;
import com.shadowexchange.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

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

    public OrderResponseDTO createOrder(OrderRequestDTO orderRequestDTO){

        if(orderRequestDTO.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Price must be greater than zero");
        }

        if(orderRequestDTO.getQuantity() <1) {
            throw new RuntimeException("Quantity must be at least 1");
        }

        if(orderRequestDTO.getType() == null){
            throw new RuntimeException("Order type must be specified");
        }

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
        Order savedOrder = orderRepository.save(order);

        return toResponseDTO(savedOrder);
    }

    public OrderResponseDTO toResponseDTO(Order order) {
        OrderResponseDTO response = new OrderResponseDTO();
        response.setId(order.getId());
        response.setUserId(order.getUser().getId());
        response.setStockId(order.getStock().getId());
        response.setPrice(order.getPrice());
        response.setQuantity(order.getQuantity());
        response.setType(order.getType());
        response.setStatus(order.getStatus());
        return response;
    }
}
