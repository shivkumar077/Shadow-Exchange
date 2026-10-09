package com.shadowexchange.service;

import com.shadowexchange.dto.OrderRequestDTO;
import com.shadowexchange.dto.OrderResponseDTO;
import com.shadowexchange.entity.Holding;
import com.shadowexchange.entity.Order;
import com.shadowexchange.entity.OrderType;
import com.shadowexchange.entity.Stock;
import com.shadowexchange.entity.User;
import com.shadowexchange.orderbook.OrderBook;
import com.shadowexchange.repository.HoldingRepository;
import com.shadowexchange.repository.OrderRepository;
import com.shadowexchange.repository.StockRepository;
import com.shadowexchange.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final StockRepository stockRepository;
    private final OrderBook orderBook;
    private final HoldingRepository holdingRepository;

    public OrderService(
            OrderRepository orderRepository,
            UserRepository userRepository,
            StockRepository stockRepository,
            HoldingRepository holdingRepository,
            OrderBook orderBook) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.stockRepository = stockRepository;
        this.holdingRepository = holdingRepository;
        this.orderBook = orderBook;
    }

    public Order saveOrder(Order order) {
        return orderRepository.save(order);
    }

    @Transactional
    public OrderResponseDTO createOrder(OrderRequestDTO orderRequestDTO) {

        if (orderRequestDTO.getPrice() == null
                || orderRequestDTO.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Price must be greater than zero");
        }

        if (orderRequestDTO.getQuantity() == null
                || orderRequestDTO.getQuantity() < 1) {
            throw new RuntimeException("Quantity must be at least 1");
        }

        if (orderRequestDTO.getType() == null) {
            throw new RuntimeException("Order type must be specified");
        }

        User user = userRepository.findById(orderRequestDTO.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Stock stock = stockRepository.findById(orderRequestDTO.getStockId())
                .orElseThrow(() -> new RuntimeException("Stock not found"));

        BigDecimal requiredFunds = orderRequestDTO.getPrice()
                .multiply(BigDecimal.valueOf(orderRequestDTO.getQuantity()));

        BigDecimal availableBalance = user.getBalance()
                .subtract(user.getReservedBalance());

        if (orderRequestDTO.getType() == OrderType.BUY
                && availableBalance.compareTo(requiredFunds) < 0) {
            throw new RuntimeException("Insufficient balance to place the order");
        }

        if (orderRequestDTO.getType() == OrderType.BUY) {
            user.setReservedBalance(
                    user.getReservedBalance().add(requiredFunds)
            );

            userRepository.save(user);
        }

        if (orderRequestDTO.getType() == OrderType.SELL) {
            Holding holding = holdingRepository.findByUserAndStock(user, stock)
                    .orElseThrow(() -> new RuntimeException("Holding not found"));

            Integer availableShares =
                    holding.getQuantity() - holding.getReservedQuantity();

            if (availableShares < orderRequestDTO.getQuantity()) {
                throw new RuntimeException("Insufficient shares to place the sell order");
            }

            holding.setReservedQuantity(
                    holding.getReservedQuantity() + orderRequestDTO.getQuantity()
            );

            holdingRepository.save(holding);
        }

        Order order = new Order(
                user,
                stock,
                orderRequestDTO.getPrice(),
                orderRequestDTO.getQuantity(),
                orderRequestDTO.getType()
        );

        Order savedOrder = orderRepository.save(order);
        orderBook.addOrder(savedOrder);

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
