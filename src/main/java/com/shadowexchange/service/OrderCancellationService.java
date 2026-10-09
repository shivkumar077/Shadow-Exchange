package com.shadowexchange.service;

import com.shadowexchange.entity.Holding;
import com.shadowexchange.entity.Order;
import com.shadowexchange.entity.OrderStatus;
import com.shadowexchange.entity.OrderType;
import com.shadowexchange.entity.User;
import com.shadowexchange.exception.OrderCannotBeCancelledException;
import com.shadowexchange.repository.HoldingRepository;
import com.shadowexchange.repository.OrderRepository;
import com.shadowexchange.orderbook.OrderBook;
import com.shadowexchange.repository.UserRepository;
import org.springframework.stereotype.Service;
import com.shadowexchange.exception.ResourceNotFoundException;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class OrderCancellationService {

    private final OrderRepository orderRepository;
    private final OrderBook orderBook;
    private final UserRepository userRepository;
    private final HoldingRepository holdingRepository;

    public OrderCancellationService(
            OrderRepository orderRepository,
            OrderBook orderBook,
            UserRepository userRepository,
            HoldingRepository holdingRepository) {
        this.orderRepository = orderRepository;
        this.orderBook = orderBook;
        this.userRepository = userRepository;
        this.holdingRepository = holdingRepository;
    }

    @Transactional
    public void cancelOrder(Long orderId) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != OrderStatus.PENDING &&
            order.getStatus() != OrderStatus.PARTIALLY_FILLED) {
            throw new OrderCannotBeCancelledException("Order can't be cancelled");
        }

        boolean removed = orderBook.removeOrder(order);

        if (!removed) {
            throw new RuntimeException("Order not found in order book");
        }

        BigDecimal reservedAmount = order.getPrice()
                .multiply(BigDecimal.valueOf(order.getQuantity()));

        if (order.getType() == OrderType.BUY) {
            User user = order.getUser();
            if (user != null) {
                if (user.getReservedBalance() != null) {
                    user.setReservedBalance(user.getReservedBalance().subtract(reservedAmount));
                }
                if (userRepository != null) {
                    userRepository.save(user);
                }
            }
        }

        if (order.getType() == OrderType.SELL) {

            Holding holding = holdingRepository
                    .findByUserAndStock(order.getUser(), order.getStock())
                    .orElseThrow(() -> new ResourceNotFoundException("Holding not found"));

            holding.setReservedQuantity(
                    holding.getReservedQuantity() - order.getQuantity()
            );

            holdingRepository.save(holding);
        }

        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
    }
}
