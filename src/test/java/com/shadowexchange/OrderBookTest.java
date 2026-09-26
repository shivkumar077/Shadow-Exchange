package com.shadowexchange;

import com.shadowexchange.entity.*;
import com.shadowexchange.matching.MatchingEngine;
import com.shadowexchange.repository.TradeRepository;
import com.shadowexchange.repository.OrderRepository;
import org.junit.jupiter.api.Test;
import com.shadowexchange.orderbook.OrderBook;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.any;
import org.mockito.ArgumentCaptor;
import static org.mockito.Mockito.times;
import static org.junit.jupiter.api.Assertions.assertEquals;

public class OrderBookTest {

    @Test
    public void bestBuyShouldHaveHighestPrice(){

        User user = new User();
        Stock stock = new Stock();
        OrderBook orderBook = new OrderBook();

        Order order1 = new Order(
                user,
                stock,
                new BigDecimal("100.00"),
                10,
                OrderType.BUY
        );

        Order order2 = new Order(
                user,
                stock,
                new BigDecimal("105.00"),
                10,
                OrderType.BUY
        );

        Order order3 = new Order(
                user,
                stock,
                new BigDecimal("100.00"),
                10,
                OrderType.BUY
        );

        orderBook.addOrder(order1);
        orderBook.addOrder(order2);
        orderBook.addOrder(order3);

        Order bestBuy = orderBook.getBestBuy();

        assertEquals(
                new BigDecimal("105.00"),
                bestBuy.getPrice()
        );
    }

    @Test
    public void olderordergetprioritywhenpriceisequal(){

        User user = new User();
        Stock stock = new Stock();
        OrderBook orderBook = new OrderBook();

        Order olderOrder = new Order(
                user,
                stock,
                new BigDecimal("100.00"),
                10,
                OrderType.BUY
        );

        Order newerOrder = new Order(
                user,
                stock,
                new BigDecimal("100.00"),
                10,
                OrderType.BUY
        );

        olderOrder.setCreatedAt(
                LocalDateTime.of(2026,9,24,10,0));
        newerOrder.setCreatedAt(
                LocalDateTime.of(2026,9,24,10,1));

        orderBook.addOrder(olderOrder);
        orderBook.addOrder(newerOrder);

        Order bestBuy = orderBook.getBestBuy();

        assertEquals(
                olderOrder,
                bestBuy
        );
    }

    @Test
    public void removeBestBuyShouldRemoveBestBuyOrder(){

        User user = new User();
        Stock stock = new Stock();
        OrderBook orderBook = new OrderBook();

        Order order1 = new Order(
                user,
                stock,
                new BigDecimal("100.00"),
                10,
                OrderType.BUY
        );

        Order order2 = new Order(
                user,
                stock,
                new BigDecimal("105.00"),
                10,
                OrderType.BUY
        );

        orderBook.addOrder(order1);
        orderBook.addOrder(order2);

        Order removedOrder = orderBook.removeBestBuy();

        assertEquals(
                order2,
                removedOrder
        );

        Order bestBuyAfterRemoval = orderBook.getBestBuy();

        assertEquals(
                order1,
                bestBuyAfterRemoval
        );
    }

    @Test
    public void removeBestSellShouldRemoveBestSellOrder(){

        User user = new User();
        Stock stock = new Stock();
        OrderBook orderBook = new OrderBook();

        Order order1 = new Order(
                user,
                stock,
                new BigDecimal("100.00"),
                10,
                OrderType.SELL
        );

        Order order2 = new Order(
                user,
                stock,
                new BigDecimal("95.00"),
                10,
                OrderType.SELL
        );

        orderBook.addOrder(order1);
        orderBook.addOrder(order2);

        Order removedOrder = orderBook.removeBestSell();

        assertEquals(
                order2,
                removedOrder
        );

        Order bestSellAfterRemoval = orderBook.getBestSell();

        assertEquals(
                order1,
                bestSellAfterRemoval
        );
    }

    @Test
    public void machineEngineShouldCreateTrade(){
        TradeRepository tradeRepository = mock(TradeRepository.class);

        OrderBook orderBook = new OrderBook();

        MatchingEngine matchingEngine = new MatchingEngine(
                orderBook,
                tradeRepository);

        User buyer = new User();
        User seller = new User();
        Stock stock = new Stock();

        Order buyOrder = new Order(
                buyer,
                stock,
                new BigDecimal("100.00"),
                10,
                OrderType.BUY
        );

        Order sellOrder = new Order(
                seller,
                stock,
                new BigDecimal("95.00"),
                10,
                OrderType.SELL
        );

        buyOrder.setCreatedAt(
                LocalDateTime.of(2026,9,24,10,1));
        sellOrder.setCreatedAt(
                LocalDateTime.of(2026,9,24,10,0));

        orderBook.addOrder(buyOrder);
        orderBook.addOrder(sellOrder);

        matchingEngine.match();

        verify(tradeRepository).save(any());

        ArgumentCaptor<Trade> tradeCaptor = ArgumentCaptor.forClass(Trade.class);
        verify(tradeRepository).save(tradeCaptor.capture());

        Trade savedtrade = tradeCaptor.getValue();

        assertEquals(
                new BigDecimal("95.00"),
                savedtrade.getPrice()
        );

    }

    @Test
    public void matchingEngineShouldCreateMultipleTrades(){

        TradeRepository tradeRepository = mock(TradeRepository.class);

        OrderBook orderBook = new OrderBook();

        MatchingEngine matchingEngine = new MatchingEngine(
                orderBook,
                tradeRepository);

        User buyer = new User();
        User seller = new User();
        Stock stock = new Stock();

        Order buyOrder1 = new Order(
                buyer,
                stock,
                new BigDecimal("100.00"),
                50,
                OrderType.BUY
        );

        Order sellOrder1 = new Order(
                seller,
                stock,
                new BigDecimal("95.00"),
                20,
                OrderType.SELL
        );

        Order sellOrder2 = new Order(
                seller,
                stock,
                new BigDecimal("96.00"),
                30,
                OrderType.SELL
        );

        buyOrder1.setCreatedAt(
                LocalDateTime.of(2026,9,24,10,2));

        sellOrder1.setCreatedAt(
                LocalDateTime.of(2026,9,24,10,0));

        sellOrder2.setCreatedAt(
                LocalDateTime.of(2026,9,24,10,1));

        orderBook.addOrder(buyOrder1);
        orderBook.addOrder(sellOrder1);
        orderBook.addOrder(sellOrder2);

        matchingEngine.match();

        verify(tradeRepository, times(2)).save(any(Trade.class));

        assertEquals(0, buyOrder1.getQuantity());
        assertNull(orderBook.getBestBuy());
        assertNull(orderBook.getBestSell());

    }

    @Test
    public void matchingEngineShouldUpdateOrderStatus(){

        TradeRepository tradeRepository = mock(TradeRepository.class);
        OrderRepository orderRepository = mock(OrderRepository.class);

        OrderBook orderBook = new OrderBook();

        MatchingEngine matchingEngine = new MatchingEngine(
                orderBook,
                tradeRepository,
                orderRepository);

        User buyer = new User();
        User seller = new User();
        Stock stock = new Stock();

        Order buyOrder1 = new Order(
                buyer,
                stock,
                new BigDecimal("100.00"),
                50,
                OrderType.BUY
        );

        Order sellOrder1 = new Order(
                seller,
                stock,
                new BigDecimal("95.00"),
                20,
                OrderType.SELL
        );

        Order sellOrder2 = new Order(
                seller,
                stock,
                new BigDecimal("96.00"),
                30,
                OrderType.SELL
        );

        buyOrder1.setCreatedAt(
                LocalDateTime.of(2026,9,24,10,2));

        sellOrder1.setCreatedAt(
                LocalDateTime.of(2026,9,24,10,0));

        sellOrder2.setCreatedAt(
                LocalDateTime.of(2026,9,24,10,1));

        orderBook.addOrder(buyOrder1);
        orderBook.addOrder(sellOrder1);
        orderBook.addOrder(sellOrder2);

        matchingEngine.match();
        verify(orderRepository,times(2)).save(buyOrder1);
        verify(orderRepository).save(sellOrder1);
        verify(orderRepository).save(sellOrder2);

        assertEquals(OrderStatus.FILLED, buyOrder1.getStatus());
        assertEquals(OrderStatus.FILLED, sellOrder1.getStatus());
        assertEquals(OrderStatus.FILLED, sellOrder2.getStatus());
    }
}
