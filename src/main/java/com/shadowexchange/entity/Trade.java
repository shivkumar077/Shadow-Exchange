package com.shadowexchange.entity;

import jakarta.persistence.*;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "trades")
public class Trade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;


    @ManyToOne
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne
    @JoinColumn(name = "stock_id", nullable = false)
    private Stock stock;

    private BigDecimal price;
    private Integer quantity;
    private LocalDateTime executedAt;

    @ManyToOne
    @JoinColumn(name = "buy_order_id", nullable = false)
    private Order buyOrder;


    @ManyToOne
    @JoinColumn(name = "sell_order_id", nullable = false)
    private Order sellOrder;

    public Trade() {
    }

    public Trade(User buyer, User seller, Stock stock, BigDecimal price, Integer quantity, Order buyOrder, Order sellOrder) {
        this.buyer = buyer;
        this.seller = seller;
        this.stock = stock;
        this.price = price;
        this.quantity = quantity;
        this.buyOrder = buyOrder;
        this.sellOrder = sellOrder;
        this.executedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getBuyer() {
        return buyer;
    }

    public void setBuyer(User buyer) {
        this.buyer = buyer;
    }

    public User getSeller() {
        return seller;
    }

    public void setSeller(User seller) {
        this.seller = seller;
    }

    public Stock getStock() {
        return stock;
    }

    public void setStock(Stock stock) {
        this.stock = stock;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public LocalDateTime getExecutedAt() {
        return executedAt;
    }

    public void setExecutedAt(LocalDateTime executedAt) {
        this.executedAt = executedAt;
    }

    public Order getBuyOrder() {
        return buyOrder;
    }

    public void setBuyOrder(Order buyOrder) {
        this.buyOrder = buyOrder;
    }

    public Order getSellOrder() {
        return sellOrder;
    }

    public void setSellOrder(Order sellOrder) {
        this.sellOrder = sellOrder;
    }
}
