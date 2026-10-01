package com.shadowexchange.service;

import com.shadowexchange.entity.Order;
import com.shadowexchange.entity.OrderStatus;
import com.shadowexchange.repository.OrderRepository;
import com.shadowexchange.orderbook.OrderBook;
import org.springframework.stereotype.Service;

@Service
public class OrderCancellationService {

    private final OrderRepository orderRepository;
    private final OrderBook orderBook;

    public OrderCancellationService(OrderRepository orderRepository, OrderBook orderBook) {
        this.orderRepository = orderRepository;
        this.orderBook = orderBook;
    }

    public void cancelOrder(Long orderId) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (order.getStatus() != OrderStatus.PENDING &&
            order.getStatus() != OrderStatus.PARTIALLY_FILLED) {
            throw new RuntimeException("Order can't be cancelled");
        }

        boolean removed = orderBook.removeOrder(order);

        if (!removed) {
            throw new RuntimeException("Order not found in order book");
        }

        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
    }
}
