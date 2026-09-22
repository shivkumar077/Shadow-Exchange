package com.shadowexchange.orderbook;

import com.shadowexchange.entity.Order;
import java.util.PriorityQueue;
import com.shadowexchange.entity.OrderType;

public class OrderBook {

    private final PriorityQueue<Order> buyOrders;
    private final PriorityQueue<Order> sellOrders;


    public OrderBook() {
        buyOrders = new PriorityQueue<>
                ((order1, order2) -> order2.getPrice().compareTo(order1.getPrice()));


        sellOrders = new PriorityQueue<>
                ((order1, order2) -> order1.getPrice().compareTo(order2.getPrice()));

    }

    public void addOrder(Order order){
        if(order.getType() == OrderType.BUY){
            buyOrders.add(order);
        }
        else{
            sellOrders.add(order);
        }
    }
}