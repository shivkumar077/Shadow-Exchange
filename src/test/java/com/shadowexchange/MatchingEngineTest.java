package com.shadowexchange;

import com.shadowexchange.entity.Order;
import com.shadowexchange.entity.OrderStatus;
import com.shadowexchange.entity.OrderType;
import com.shadowexchange.entity.Stock;
import com.shadowexchange.entity.Trade;
import com.shadowexchange.entity.User;
import com.shadowexchange.matching.MatchingEngine;
import com.shadowexchange.orderbook.OrderBook;
import com.shadowexchange.repository.OrderRepository;
import com.shadowexchange.repository.TradeRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class MatchingEngineTest {

    @Test
    void shouldKeepUnfilledBuyQuantityAfterPartialFill() {
        OrderBook orderBook = new OrderBook();
        TradeRepository tradeRepository = mock(TradeRepository.class);
        OrderRepository orderRepository = mock(OrderRepository.class);

        MatchingEngine matchingEngine = new MatchingEngine(
                orderBook,
                tradeRepository,
                orderRepository
        );

        User buyer = new User();
        User seller = new User();
        Stock stock = new Stock();

        Order buyOrder = new Order(
                buyer,
                stock,
                new BigDecimal("100.00"),
                100,
                OrderType.BUY
        );

        Order sellOrder = new Order(
                seller,
                stock,
                new BigDecimal("95.00"),
                40,
                OrderType.SELL
        );

        orderBook.addOrder(buyOrder);
        orderBook.addOrder(sellOrder);

        matchingEngine.match();

        assertEquals(60, buyOrder.getQuantity());
        assertEquals(OrderStatus.PARTIALLY_FILLED, buyOrder.getStatus());

        assertEquals(0, sellOrder.getQuantity());
        assertEquals(OrderStatus.FILLED, sellOrder.getStatus());

        assertEquals(buyOrder, orderBook.getBestBuy());
        assertNull(orderBook.getBestSell());

        verify(tradeRepository, times(1)).save(any(Trade.class));
        verify(orderRepository).save(buyOrder);
        verify(orderRepository).save(sellOrder);
    }
}
