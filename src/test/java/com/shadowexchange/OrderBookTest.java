package com.shadowexchange;

import org.junit.jupiter.api.Test;
import com.shadowexchange.entity.Order;
import com.shadowexchange.entity.OrderType;
import com.shadowexchange.entity.Stock;
import com.shadowexchange.entity.User;
import com.shadowexchange.orderbook.OrderBook;
import java.math.BigDecimal;
import java.time.LocalDateTime;

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
}
