package com.shadowexchange.orderbook;

import com.shadowexchange.entity.Order;
import java.util.PriorityQueue;

public class OrderBook {

    private final PriorityQueue<Order> buyOrders;
    private final PriorityQueue<Order> sellOrders;


    public OrderBook() {
        buyOrders = new PriorityQueue<>
                ((order1, order2) -> order2.getPrice().compareTo(order1.getPrice()));


        sellOrders = new PriorityQueue<>
                ((order1, order2) -> order1.getPrice().compareTo(order2.getPrice()));

    }
}