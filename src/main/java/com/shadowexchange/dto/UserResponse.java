package com.shadowexchange.dto;

public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private Double balance;

    public UserResponse() {
    }

    public UserResponse(Long id, String username, String email, Double balance) {
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

    public Double getBalance() {
        return balance;
    }
}
