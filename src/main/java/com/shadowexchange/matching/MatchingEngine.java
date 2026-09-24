package com.shadowexchange.matching;

import com.shadowexchange.entity.Order;
import com.shadowexchange.orderbook.OrderBook;
import java.math.BigDecimal;

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

        if(bestBuy.getPrice().compareTo(bestSell.getPrice()) < 0){
            return;
        }

        int tradeQuantity = Math.min(
                bestBuy.getQuantity(),
                bestSell.getQuantity()
        );

        BigDecimal tradePrice;

        if(bestBuy.getCreatedAt().isBefore(bestSell.getCreatedAt())){
            tradePrice = bestBuy.getPrice();
        }
        else{
            tradePrice = bestSell.getPrice();
        }

        bestBuy.setQuantity(
                bestBuy.getQuantity() -  tradeQuantity
        );

        bestSell.setQuantity(
                bestSell.getQuantity() - tradeQuantity
        );

        if(bestBuy.getQuantity() == 0){
            orderBook.removeBestBuy();
        }

        if(bestSell.getQuantity() == 0){
            orderBook.removeBestSell();
        }
    }


}
