package com.shadowexchange.controller;

import com.shadowexchange.dto.OrderRequestDTO;
import com.shadowexchange.dto.OrderResponseDTO;
import com.shadowexchange.entity.Order;
import com.shadowexchange.service.OrderService;
import org.springframework.web.bind.annotation.*;
import com.shadowexchange.service.OrderCancellationService;

@RestController

@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;
    private final OrderCancellationService CancellationService;

    public OrderController(OrderService orderService,
                           OrderCancellationService cancellationService) {

        this.orderService = orderService;
        this.CancellationService = cancellationService;
    }

    @PostMapping
    public OrderResponseDTO createOrder(@RequestBody OrderRequestDTO orderRequestDTO) {
        return orderService.createOrder(orderRequestDTO);
    }

    @GetMapping("/user/{userId}")
    public java.util.List<OrderResponseDTO> getUserOrders(@PathVariable Long userId) {
        return orderService.getOrdersForUser(userId);
    }

    @DeleteMapping("/{orderId}")
    public void cancelOrder(@PathVariable Long orderId) {
        CancellationService.cancelOrder(orderId);
    }

}
