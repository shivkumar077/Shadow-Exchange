package com.shadowexchange.dto;

import java.util.List;

public class OrderBookResponseDTO {

    private Long stockId;
    private List<OrderResponseDTO> bids;
    private List<OrderResponseDTO> asks;

    public OrderBookResponseDTO() {
    }

    public OrderBookResponseDTO(
            Long stockId,
            List<OrderResponseDTO> bids,
            List<OrderResponseDTO> asks
    ) {
        this.stockId = stockId;
        this.bids = bids;
        this.asks = asks;
    }

    public Long getStockId() {
        return stockId;
    }

    public void setStockId(Long stockId) {
        this.stockId = stockId;
    }

    public List<OrderResponseDTO> getBids() {
        return bids;
    }

    public void setBids(List<OrderResponseDTO> bids) {
        this.bids = bids;
    }

    public List<OrderResponseDTO> getAsks() {
        return asks;
    }

    public void setAsks(List<OrderResponseDTO> asks) {
        this.asks = asks;
    }
}
