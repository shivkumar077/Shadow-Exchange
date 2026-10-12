package com.shadowexchange.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PublicTradeResponse {

    private final Long tradeId;
    private final Long stockId;
    private final String symbol;
    private final BigDecimal price;
    private final Integer quantity;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private final LocalDateTime executedAt;

    public PublicTradeResponse(
            Long tradeId,
            Long stockId,
            String symbol,
            BigDecimal price,
            Integer quantity,
            LocalDateTime executedAt) {
        this.tradeId = tradeId;
        this.stockId = stockId;
        this.symbol = symbol;
        this.price = price;
        this.quantity = quantity;
        this.executedAt = executedAt;
    }

    public Long getTradeId() {
        return tradeId;
    }

    public Long getStockId() {
        return stockId;
    }

    public String getSymbol() {
        return symbol;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public LocalDateTime getExecutedAt() {
        return executedAt;
    }
}
