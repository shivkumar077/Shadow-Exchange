package com.shadowexchange.event;

import com.shadowexchange.dto.PublicTradeResponse;

import java.util.Objects;

public class TradeExecutedEvent {

    private final PublicTradeResponse trade;

    public TradeExecutedEvent(PublicTradeResponse trade) {
        this.trade = Objects.requireNonNull(trade, "trade must not be null");
    }

    public PublicTradeResponse getTrade() {
        return trade;
    }
}
