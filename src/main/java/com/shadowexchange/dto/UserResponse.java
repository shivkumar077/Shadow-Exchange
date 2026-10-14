package com.shadowexchange.dto;

import com.shadowexchange.entity.AuthProvider;

import java.math.BigDecimal;

public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private BigDecimal balance;
    private BigDecimal reservedBalance;
    private AuthProvider authProvider;
    private String avatarUrl;
    private Boolean isDemo;

    public UserResponse() {
    }

    public UserResponse(Long id, String username, String email, BigDecimal balance, BigDecimal reservedBalance) {
        this(id, username, email, balance, reservedBalance, AuthProvider.LOCAL_DEMO, null, false);
    }

    public UserResponse(Long id, String username, String email, BigDecimal balance, BigDecimal reservedBalance,
                        AuthProvider authProvider, String avatarUrl, Boolean isDemo) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.balance = balance;
        this.reservedBalance = reservedBalance;
        this.authProvider = authProvider;
        this.avatarUrl = avatarUrl;
        this.isDemo = isDemo != null && isDemo;
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

    public AuthProvider getAuthProvider() {
        return authProvider;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public Boolean getIsDemo() {
        return isDemo;
    }
}

