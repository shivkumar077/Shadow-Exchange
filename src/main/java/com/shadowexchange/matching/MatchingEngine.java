package com.shadowexchange.matching;

import com.shadowexchange.dto.PublicTradeResponse;
import com.shadowexchange.entity.Order;
import com.shadowexchange.entity.OrderStatus;
import com.shadowexchange.entity.Trade;
import com.shadowexchange.entity.Stock;
import com.shadowexchange.event.TradeExecutedEvent;
import com.shadowexchange.orderbook.OrderBook;
import com.shadowexchange.repository.OrderRepository;
import com.shadowexchange.repository.TradeRepository;
import com.shadowexchange.service.SettlementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
public class MatchingEngine {

    private final OrderBook orderBook;
    private final TradeRepository tradeRepository;
    private final OrderRepository orderRepository;
    private final SettlementService settlementService;
    private final ApplicationEventPublisher eventPublisher;

    @Autowired
    public MatchingEngine(
            OrderBook orderBook,
            TradeRepository tradeRepository,
            OrderRepository orderRepository,
            SettlementService settlementService,
            ApplicationEventPublisher eventPublisher) {
        this.orderBook = orderBook;
        this.tradeRepository = tradeRepository;
        this.orderRepository = orderRepository;
        this.settlementService = settlementService;
        this.eventPublisher = eventPublisher;
    }

    // Kept for unit tests that exercise matching without database settlement.
    public MatchingEngine(OrderBook orderBook, TradeRepository tradeRepository) {
        this(orderBook, tradeRepository, null, null, event -> {});
    }

    // Kept for unit tests that verify order persistence separately.
    public MatchingEngine(
            OrderBook orderBook,
            TradeRepository tradeRepository,
            OrderRepository orderRepository) {
        this(orderBook, tradeRepository, orderRepository, null, event -> {});
    }

    // Kept for legacy unit tests that do not test event publishing.
    public MatchingEngine(
            OrderBook orderBook,
            TradeRepository tradeRepository,
            OrderRepository orderRepository,
            SettlementService settlementService) {
        this(orderBook, tradeRepository, orderRepository, settlementService, event -> {});
    }

    @Transactional
    public void match() {
        // Match each stock independently. A BUY order for one stock must never
        // execute against a SELL order for another stock.
        for (Stock stock : orderBook.getStocksWithOrders()) {
            while (true) {
                Order bestBuy = orderBook.getBestBuy(stock);
                Order bestSell = orderBook.getBestSell(stock);

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
                        stock,
                        tradePrice,
                        tradeQuantity,
                        bestBuy,
                        bestSell
                );

                // Settle before mutating the in-memory order book. If validation
                // fails, this match does not consume the orders in memory.
                if (settlementService != null) {
                    settlementService.settleTrade(trade);
                }

                bestBuy.setQuantity(bestBuy.getQuantity() - tradeQuantity);
                bestSell.setQuantity(bestSell.getQuantity() - tradeQuantity);

                if (bestBuy.getQuantity() == 0) {
                    bestBuy.setStatus(OrderStatus.FILLED);
                    orderBook.removeBestBuy(stock);
                } else {
                    bestBuy.setStatus(OrderStatus.PARTIALLY_FILLED);
                }

                if (bestSell.getQuantity() == 0) {
                    bestSell.setStatus(OrderStatus.FILLED);
                    orderBook.removeBestSell(stock);
                } else {
                    bestSell.setStatus(OrderStatus.PARTIALLY_FILLED);
                }

                Trade savedTrade = tradeRepository.save(trade);

                if (orderRepository != null) {
                    orderRepository.save(bestBuy);
                    orderRepository.save(bestSell);
                }

                Long tradeId = savedTrade != null ? savedTrade.getId() : trade.getId();
                if (tradeId != null) {
                    LocalDateTime executedAt = savedTrade != null && savedTrade.getExecutedAt() != null
                            ? savedTrade.getExecutedAt()
                            : trade.getExecutedAt();

                    PublicTradeResponse publicTrade = new PublicTradeResponse(
                            tradeId,
                            stock.getId(),
                            stock.getSymbol(),
                            tradePrice,
                            tradeQuantity,
                            executedAt
                    );

                    eventPublisher.publishEvent(new TradeExecutedEvent(publicTrade));
                }
            }
        }
    }
}
