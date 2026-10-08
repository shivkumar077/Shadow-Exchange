package com.shadowexchange.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "holdings")
public class Holding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;


    @ManyToOne
    @JoinColumn(name = "stock_id", nullable = false)
    private Stock stock;

    private Integer quantity;

    public Integer reserveQuantity;

    public Holding() {
    }

    public Holding(User user, Stock stock, Integer quantity) {
        this.user = user;
        this.stock = stock;
        this.quantity = quantity;
        this.reserveQuantity = 0;
    }

    public Holding(User user, Stock stock, Integer quantity, Integer reserveQuantity) {
        this.user = user;
        this.stock = stock;
        this.quantity = quantity;
        this.reserveQuantity = reserveQuantity;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Stock getStock() {
        return stock;
    }

    public void setStock(Stock stock) {
        this.stock = stock;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Integer getReserveQuantity() {
        return reserveQuantity;
    }

    public void setReserveQuantity(Integer reserveQuantity) {
        this.reserveQuantity = reserveQuantity;
    }
}
