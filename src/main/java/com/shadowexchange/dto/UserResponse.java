package com.shadowexchange.dto;

import java.math.BigDecimal;

public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private BigDecimal balance;
    private BigDecimal reservedBalance;

    public UserResponse() {
    }

    public UserResponse(Long id, String username, String email, BigDecimal balance, BigDecimal reservedBalance) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.balance = balance;
        this.reservedBalance = reservedBalance;
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

    public BigDecimal getReservedBalance() {
        return reservedBalance;
    }
}
