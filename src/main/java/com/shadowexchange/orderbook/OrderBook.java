package com.shadowexchange.orderbook;

import com.shadowexchange.entity.Order;
import com.shadowexchange.entity.OrderType;
import com.shadowexchange.entity.Stock;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;

@Component
public class OrderBook {

    private static final Comparator<Order> BUY_PRIORITY =
            Comparator.comparing(Order::getPrice, Comparator.reverseOrder())
                    .thenComparing(
                            Order::getCreatedAt,
                            Comparator.nullsLast(Comparator.naturalOrder())
                    );

    private static final Comparator<Order> SELL_PRIORITY =
            Comparator.comparing(Order::getPrice)
                    .thenComparing(
                            Order::getCreatedAt,
                            Comparator.nullsLast(Comparator.naturalOrder())
                    );

    private final Map<Object, StockOrderBook> booksByStock = new HashMap<>();

    private static class StockOrderBook {
        private final Stock stock;
        private final PriorityQueue<Order> buyOrders =
                new PriorityQueue<>(BUY_PRIORITY);
        private final PriorityQueue<Order> sellOrders =
                new PriorityQueue<>(SELL_PRIORITY);

        private StockOrderBook(Stock stock) {
            this.stock = stock;
        }

        private boolean isEmpty() {
            return buyOrders.isEmpty() && sellOrders.isEmpty();
        }
    }

    private Object stockKey(Stock stock) {
        // Persisted stocks are grouped by database ID. Unsaved stocks in unit
        // tests are grouped by object identity so unrelated stocks stay separate.
        return stock.getId() != null ? stock.getId() : stock;
    }

    private StockOrderBook getBook(Stock stock) {
        if (stock == null) {
            return null;
        }
        return booksByStock.get(stockKey(stock));
    }

    private void removeBookIfEmpty(StockOrderBook book) {
        if (book != null && book.isEmpty()) {
            booksByStock.remove(stockKey(book.stock));
        }
    }

    public void addOrder(Order order) {
        if (order == null || order.getStock() == null) {
            return;
        }

        StockOrderBook book = booksByStock.computeIfAbsent(
                stockKey(order.getStock()),
                key -> new StockOrderBook(order.getStock())
        );

        if (order.getType() == OrderType.BUY) {
            book.buyOrders.add(order);
        } else {
            book.sellOrders.add(order);
        }
    }

    public List<Stock> getStocksWithOrders() {
        return new ArrayList<>(
                booksByStock.values().stream()
                        .map(book -> book.stock)
                        .toList()
        );
    }

    public Order getBestBuy(Stock stock) {
        StockOrderBook book = getBook(stock);
        return book == null ? null : book.buyOrders.peek();
    }

    public Order getBestSell(Stock stock) {
        StockOrderBook book = getBook(stock);
        return book == null ? null : book.sellOrders.peek();
    }

    public Order removeBestBuy(Stock stock) {
        StockOrderBook book = getBook(stock);
        if (book == null) {
            return null;
        }

        Order removed = book.buyOrders.poll();
        removeBookIfEmpty(book);
        return removed;
    }

    public Order removeBestSell(Stock stock) {
        StockOrderBook book = getBook(stock);
        if (book == null) {
            return null;
        }

        Order removed = book.sellOrders.poll();
        removeBookIfEmpty(book);
        return removed;
    }

    // Global accessors are retained for existing tests and general book inspection.
    public Order getBestBuy() {
        Order best = null;
        for (StockOrderBook book : booksByStock.values()) {
            Order candidate = book.buyOrders.peek();
            if (candidate != null
                    && (best == null || BUY_PRIORITY.compare(candidate, best) < 0)) {
                best = candidate;
            }
        }
        return best;
    }

    public Order getBestSell() {
        Order best = null;
        for (StockOrderBook book : booksByStock.values()) {
            Order candidate = book.sellOrders.peek();
            if (candidate != null
                    && (best == null || SELL_PRIORITY.compare(candidate, best) < 0)) {
                best = candidate;
            }
        }
        return best;
    }

    public Order removeBestBuy() {
        Order best = getBestBuy();
        if (best == null) {
            return null;
        }
        StockOrderBook book = getBook(best.getStock());
        book.buyOrders.remove(best);
        removeBookIfEmpty(book);
        return best;
    }

    public Order removeBestSell() {
        Order best = getBestSell();
        if (best == null) {
            return null;
        }
        StockOrderBook book = getBook(best.getStock());
        book.sellOrders.remove(best);
        removeBookIfEmpty(book);
        return best;
    }

    public boolean removeOrder(Order order) {
        if (order == null || order.getStock() == null) {
            return false;
        }

        StockOrderBook book = getBook(order.getStock());
        if (book == null) {
            return false;
        }

        boolean removed;
        if (order.getType() == OrderType.BUY) {
            removed = book.buyOrders.remove(order);
        } else {
            removed = book.sellOrders.remove(order);
        }

        removeBookIfEmpty(book);
        return removed;
    }
}
