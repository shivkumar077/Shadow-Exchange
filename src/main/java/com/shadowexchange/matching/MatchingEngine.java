package com.shadowexchange.matching;

import com.shadowexchange.entity.Order;
import com.shadowexchange.entity.OrderStatus;
import com.shadowexchange.entity.Trade;
import com.shadowexchange.orderbook.OrderBook;
import com.shadowexchange.repository.OrderRepository;
import com.shadowexchange.repository.TradeRepository;
import com.shadowexchange.service.SettlementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Component
public class MatchingEngine {

    private final OrderBook orderBook;
    private final TradeRepository tradeRepository;
    private final OrderRepository orderRepository;
    private final SettlementService settlementService;

    @Autowired
    public MatchingEngine(
            OrderBook orderBook,
            TradeRepository tradeRepository,
            OrderRepository orderRepository,
            SettlementService settlementService) {
        this.orderBook = orderBook;
        this.tradeRepository = tradeRepository;
        this.orderRepository = orderRepository;
        this.settlementService = settlementService;
    }

    // Kept for unit tests that exercise matching without database settlement.
    public MatchingEngine(OrderBook orderBook, TradeRepository tradeRepository) {
        this(orderBook, tradeRepository, null, null);
    }

    // Kept for unit tests that verify order persistence separately.
    public MatchingEngine(
            OrderBook orderBook,
            TradeRepository tradeRepository,
            OrderRepository orderRepository) {
        this(orderBook, tradeRepository, orderRepository, null);
    }

    @Transactional
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

            Trade trade = new Trade(
                    bestBuy.getUser(),
                    bestSell.getUser(),
                    bestBuy.getStock(),
                    tradePrice,
                    tradeQuantity,
                    bestBuy,
                    bestSell
            );

            // Settle before mutating the in-memory order book. If validation fails,
            // this match does not consume the orders in memory.
            if (settlementService != null) {
                settlementService.settleTrade(trade);
            }

            bestBuy.setQuantity(bestBuy.getQuantity() - tradeQuantity);
            bestSell.setQuantity(bestSell.getQuantity() - tradeQuantity);

            if (bestBuy.getQuantity() == 0) {
                bestBuy.setStatus(OrderStatus.FILLED);
                orderBook.removeBestBuy();
            } else {
                bestBuy.setStatus(OrderStatus.PARTIALLY_FILLED);
            }

            if (bestSell.getQuantity() == 0) {
                bestSell.setStatus(OrderStatus.FILLED);
                orderBook.removeBestSell();
            } else {
                bestSell.setStatus(OrderStatus.PARTIALLY_FILLED);
            }

            tradeRepository.save(trade);

            if (orderRepository != null) {
                orderRepository.save(bestBuy);
                orderRepository.save(bestSell);
            }
        }
    }
}
