package com.shadowexchange.dto;

import java.math.BigDecimal;

public class HoldingResponse {
    private Long id;
    private Long stockId;
    private String symbol;
    private String companyName;
    private BigDecimal currentPrice;
    private Integer quantity;
    private Integer reservedQuantity;
    private Integer availableQuantity;
    private BigDecimal marketValue;

    public HoldingResponse() {
    }

    public HoldingResponse(Long id, Long stockId, String symbol, String companyName,
                           BigDecimal currentPrice, Integer quantity, Integer reservedQuantity) {
        this.id = id;
        this.stockId = stockId;
        this.symbol = symbol;
        this.companyName = companyName;
        this.currentPrice = currentPrice;
        this.quantity = quantity;
        this.reservedQuantity = reservedQuantity == null ? 0 : reservedQuantity;
        this.availableQuantity = quantity - this.reservedQuantity;
        this.marketValue = currentPrice.multiply(BigDecimal.valueOf(quantity));
    }

    public Long getId() { return id; }
    public Long getStockId() { return stockId; }
    public String getSymbol() { return symbol; }
    public String getCompanyName() { return companyName; }
    public BigDecimal getCurrentPrice() { return currentPrice; }
    public Integer getQuantity() { return quantity; }
    public Integer getReservedQuantity() { return reservedQuantity; }
    public Integer getAvailableQuantity() { return availableQuantity; }
    public BigDecimal getMarketValue() { return marketValue; }
}
