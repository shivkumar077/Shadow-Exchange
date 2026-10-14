package com.shadowexchange.controller;

import com.shadowexchange.dto.OrderBookResponseDTO;
import com.shadowexchange.dto.OrderRequestDTO;
import com.shadowexchange.dto.OrderResponseDTO;
import com.shadowexchange.security.SecurityUserHelper;
import com.shadowexchange.service.OrderCancellationService;
import com.shadowexchange.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;
    private final OrderCancellationService cancellationService;
    private final SecurityUserHelper securityUserHelper;

    public OrderController(
            OrderService orderService,
            OrderCancellationService cancellationService,
            SecurityUserHelper securityUserHelper) {
        this.orderService = orderService;
        this.cancellationService = cancellationService;
        this.securityUserHelper = securityUserHelper;
    }

    @PostMapping
    public OrderResponseDTO createOrder(@RequestBody OrderRequestDTO orderRequestDTO) {
        Long actingUserId = securityUserHelper.requireCurrentUserId();
        if (orderRequestDTO.getUserId() != null && !orderRequestDTO.getUserId().equals(actingUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot place orders on behalf of another user");
        }
        orderRequestDTO.setUserId(actingUserId);
        return orderService.createOrder(orderRequestDTO);
    }

    @GetMapping("/book/{stockId}")
    public OrderBookResponseDTO getOrderBook(@PathVariable Long stockId) {
        return orderService.getOrderBook(stockId);
    }

    @GetMapping("/user/{userId}")
    public List<OrderResponseDTO> getUserOrders(@PathVariable Long userId) {
        Long actingUserId = securityUserHelper.requireCurrentUserId();
        if (!actingUserId.equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot view orders of another user");
        }
        return orderService.getOrdersForUser(userId);
    }

    @DeleteMapping("/{orderId}")
    public ResponseEntity<Void> cancelOrder(@PathVariable Long orderId) {
        Long actingUserId = securityUserHelper.requireCurrentUserId();
        cancellationService.cancelOrder(orderId, actingUserId);
        return ResponseEntity.noContent().build();
    }
}

