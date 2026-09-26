package com.shadowexchange.matching;

import com.shadowexchange.entity.Order;
import com.shadowexchange.entity.Trade;
import com.shadowexchange.orderbook.OrderBook;
import java.math.BigDecimal;
import com.shadowexchange.repository.TradeRepository;

public class MatchingEngine {

    private final OrderBook orderBook;
    private final TradeRepository tradeRepository;

    public MatchingEngine(OrderBook orderBook, TradeRepository tradeRepository) {
        this.orderBook = orderBook;
        this.tradeRepository = tradeRepository;
    }

    public void match() {

        while (true) {

            Order bestBuy = orderBook.getBestBuy();
            Order bestSell = orderBook.getBestSell();

            if (bestBuy == null || bestSell == null) {
                break;
            }

            if (bestBuy.getPrice().compareTo(bestSell.getPrice()) < 0) {
                break;
            }

            int tradeQuantity = Math.min(
                    bestBuy.getQuantity(),
                    bestSell.getQuantity()
            );

            BigDecimal tradePrice;

            if (bestBuy.getCreatedAt().isBefore(bestSell.getCreatedAt())) {
                tradePrice = bestBuy.getPrice();
            } else {
                tradePrice = bestSell.getPrice();
            }

            bestBuy.setQuantity(
                    bestBuy.getQuantity() - tradeQuantity
            );

            bestSell.setQuantity(
                    bestSell.getQuantity() - tradeQuantity
            );

            if (bestBuy.getQuantity() == 0) {
                orderBook.removeBestBuy();
            }

            if (bestSell.getQuantity() == 0) {
                orderBook.removeBestSell();
            }

            Trade trade = new Trade(
                    bestBuy.getUser(),
                    bestSell.getUser(),
                    bestBuy.getStock(),
                    tradePrice,
                    tradeQuantity
            );

            tradeRepository.save(trade);
        }
    }

}