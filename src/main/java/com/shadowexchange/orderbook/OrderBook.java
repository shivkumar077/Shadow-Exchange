package com.shadowexchange.orderbook;

import com.shadowexchange.entity.Order;
import java.util.PriorityQueue;
import com.shadowexchange.entity.OrderType;
import java.util.Comparator;

public class OrderBook {

    private final PriorityQueue<Order> buyOrders;
    private final PriorityQueue<Order> sellOrders;


    public OrderBook() {
        buyOrders = new PriorityQueue<>(
                Comparator.comparing(Order::getPrice, Comparator.reverseOrder())
                        .thenComparing(Order::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
        );

        sellOrders = new PriorityQueue<>(
                Comparator.comparing(Order::getPrice)
                        .thenComparing(Order::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
        );
    }

    public void addOrder(Order order){
        if(order == null) return;
        if(order.getType() == OrderType.BUY){
            buyOrders.add(order);
        }
        else{
            sellOrders.add(order);
        }
    }

    public Order getBestBuy() {
        Order bestBuyOrder = buyOrders.peek();
        return bestBuyOrder;
    }

    public Order getBestSell() {
        Order bestSellOrder = sellOrders.peek();
        return bestSellOrder;
    }
}