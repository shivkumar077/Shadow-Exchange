package com.shadowexchange.dto;

import java.math.BigDecimal;

public class StockResponse {

    private Long id;
    private String symbol;
    private String companyName;
    private BigDecimal currentPrice;

    public StockResponse() {
    }

    public StockResponse(Long id, String symbol, String companyName, BigDecimal currentPrice) {
        this.id = id;
        this.symbol = symbol;
        this.companyName = companyName;
        this.currentPrice = currentPrice;
    }

    public Long getId() {
        return id;
    }

    public String getCompanyName() {
        return companyName;
    }

    public String getSymbol() {
        return symbol;
    }

    public BigDecimal getCurrentPrice() {
        return currentPrice;
    }
}
