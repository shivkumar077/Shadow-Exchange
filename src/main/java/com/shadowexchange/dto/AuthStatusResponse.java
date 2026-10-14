package com.shadowexchange.dto;

import com.shadowexchange.entity.AuthProvider;
import com.shadowexchange.entity.User;

import java.math.BigDecimal;

/**
 * Safe DTO returned by /api/auth/me.
 * Exposes identity status, balances, and public profile data without leaking tokens or passwords.
 */
public class AuthStatusResponse {

    private boolean authenticated;
    private Long id;
    private String username;
    private String email;
    private String avatarUrl;
    private AuthProvider authProvider;
    private Boolean isDemo;
    private BigDecimal balance;
    private BigDecimal reservedBalance;

    public AuthStatusResponse() {
    }

    public static AuthStatusResponse authenticated(User user) {
        AuthStatusResponse response = new AuthStatusResponse();
        response.setAuthenticated(true);
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setAvatarUrl(user.getAvatarUrl());
        response.setAuthProvider(user.getAuthProvider());
        response.setIsDemo(user.getIsDemo());
        response.setBalance(user.getBalance());
        response.setReservedBalance(user.getReservedBalance());
        return response;
    }

    public static AuthStatusResponse unauthenticated() {
        AuthStatusResponse response = new AuthStatusResponse();
        response.setAuthenticated(false);
        return response;
    }

    public boolean isAuthenticated() {
        return authenticated;
    }

    public void setAuthenticated(boolean authenticated) {
        this.authenticated = authenticated;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public AuthProvider getAuthProvider() {
        return authProvider;
    }

    public void setAuthProvider(AuthProvider authProvider) {
        this.authProvider = authProvider;
    }

    public Boolean getIsDemo() {
        return isDemo;
    }

    public void setIsDemo(Boolean isDemo) {
        this.isDemo = isDemo;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }

    public BigDecimal getReservedBalance() {
        return reservedBalance;
    }

    public void setReservedBalance(BigDecimal reservedBalance) {
        this.reservedBalance = reservedBalance;
    }
}
