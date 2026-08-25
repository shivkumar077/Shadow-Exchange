package com.shadowexchange.controller;

import com.shadowexchange.entity.Order;
import com.shadowexchange.service.OrderService;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController

@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PutMapping
    public Order createOrder(Order order) {
        return orderService.saveOrder(order);
    }
}
