package com.shadowexchange.matching;

import com.shadowexchange.entity.Order;
import com.shadowexchange.orderbook.OrderBook;

public class MatchingEngine {

    private final OrderBook orderBook;

    public MatchingEngine(OrderBook orderBook) {
        this.orderBook = orderBook;
    }

    public void match(){
        Order bestBuy = orderBook.getBestBuy();
        Order bestSell = orderBook.getBestSell();

        if(bestBuy == null || bestSell == null){
            return;
        }
    }


}
