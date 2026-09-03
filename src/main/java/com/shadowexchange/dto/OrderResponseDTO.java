package com.shadowexchange.dto;

import com.shadowexchange.entity.OrderStatus;
import com.shadowexchange.entity.OrderType;

import java.math.BigDecimal;

public class OrderResponseDTO {

    private Long id;
    private Long userId;
    private Long stockId;
    private OrderType type;
    private BigDecimal price;
    private Integer quantity;
    private OrderStatus status;

    public OrderResponseDTO() {
    }

    public OrderResponseDTO(Long id, Long userId, Long stockId, OrderType type, BigDecimal price, Integer quantity, OrderStatus status) {
        this.id = id;
        this.userId = userId;
        this.stockId = stockId;
        this.type = type;
        this.price = price;
        this.quantity = quantity;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getStockId() {
        return stockId;
    }

    public void setStockId(Long stockId) {
        this.stockId = stockId;
    }

    public OrderType getType() {
        return type;
    }

    public void setType(OrderType type) {
        this.type = type;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
