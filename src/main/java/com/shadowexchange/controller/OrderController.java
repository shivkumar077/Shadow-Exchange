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

    @DeleteMapping("/{orderId}")
    public void cancelOrder(@PathVariable Long orderId) {
        CancellationService.cancelOrder(orderId);
    }

}
