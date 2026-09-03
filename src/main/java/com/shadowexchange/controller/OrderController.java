package com.shadowexchange.controller;

import com.shadowexchange.dto.OrderRequestDTO;
import com.shadowexchange.dto.OrderResponseDTO;
import com.shadowexchange.entity.Order;
import com.shadowexchange.service.OrderService;
import org.springframework.web.bind.annotation.*;

@RestController

@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public OrderResponseDTO createOrder(@RequestBody OrderRequestDTO orderRequestDTO) {
        return orderService.createOrder(orderRequestDTO);
    }
}
