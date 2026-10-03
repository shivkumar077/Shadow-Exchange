package com.shadowexchange.dto;

import java.math.BigDecimal;

public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private BigDecimal balance;

    public UserResponse() {
    }

    public UserResponse(Long id, String username, String email, BigDecimal balance) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.balance = balance;
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public BigDecimal getBalance() {
        return balance;
    }
}
