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
import com.shadowexchange.service.SettlementService;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.ArgumentCaptor;

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

    @Test
    void shouldMatchOneBuyOrderAgainstMultipleSellOrders() {
        OrderBook orderBook = new OrderBook();
        TradeRepository tradeRepository = mock(TradeRepository.class);
        OrderRepository orderRepository = mock(OrderRepository.class);

        MatchingEngine matchingEngine = new MatchingEngine(
                orderBook,
                tradeRepository,
                orderRepository
        );

        User buyer = new User();
        User firstSeller = new User();
        User secondSeller = new User();
        Stock stock = new Stock();

        Order buyOrder = new Order(
                buyer,
                stock,
                new BigDecimal("100.00"),
                100,
                OrderType.BUY
        );

        // Add the first sell order before the second so it has time priority.
        Order firstSellOrder = new Order(
                firstSeller,
                stock,
                new BigDecimal("95.00"),
                30,
                OrderType.SELL
        );

        Order secondSellOrder = new Order(
                secondSeller,
                stock,
                new BigDecimal("96.00"),
                20,
                OrderType.SELL
        );

        orderBook.addOrder(buyOrder);
        orderBook.addOrder(firstSellOrder);
        orderBook.addOrder(secondSellOrder);

        matchingEngine.match();

        // The BUY order should have 50 shares left after buying 30 + 20.
        assertEquals(50, buyOrder.getQuantity());
        assertEquals(OrderStatus.PARTIALLY_FILLED, buyOrder.getStatus());

        // Both SELL orders should be fully consumed.
        assertEquals(0, firstSellOrder.getQuantity());
        assertEquals(OrderStatus.FILLED, firstSellOrder.getStatus());
        assertEquals(0, secondSellOrder.getQuantity());
        assertEquals(OrderStatus.FILLED, secondSellOrder.getStatus());

        // The remaining BUY stays in the book; no SELL orders remain.
        assertEquals(buyOrder, orderBook.getBestBuy());
        assertNull(orderBook.getBestSell());

        ArgumentCaptor<Trade> tradeCaptor = ArgumentCaptor.forClass(Trade.class);
        verify(tradeRepository, times(2)).save(tradeCaptor.capture());

        assertEquals(30, tradeCaptor.getAllValues().get(0).getQuantity());
        assertEquals(20, tradeCaptor.getAllValues().get(1).getQuantity());

        verify(orderRepository, times(2)).save(buyOrder);
        verify(orderRepository).save(firstSellOrder);
        verify(orderRepository).save(secondSellOrder);
    }

    @Test
    void shouldSettleTradeBeforeConsumingOrdersFromTheBook() {
        OrderBook orderBook = new OrderBook();
        TradeRepository tradeRepository = mock(TradeRepository.class);
        OrderRepository orderRepository = mock(OrderRepository.class);
        SettlementService settlementService = mock(SettlementService.class);

        MatchingEngine matchingEngine = new MatchingEngine(
                orderBook,
                tradeRepository,
                orderRepository,
                settlementService
        );

        User buyer = new User();
        User seller = new User();
        Stock stock = new Stock();

        Order buyOrder = new Order(
                buyer, stock, new BigDecimal("100.00"), 10, OrderType.BUY
        );
        Order sellOrder = new Order(
                seller, stock, new BigDecimal("95.00"), 10, OrderType.SELL
        );

        orderBook.addOrder(buyOrder);
        orderBook.addOrder(sellOrder);

        matchingEngine.match();

        ArgumentCaptor<Trade> tradeCaptor = ArgumentCaptor.forClass(Trade.class);
        verify(settlementService).settleTrade(tradeCaptor.capture());
        assertEquals(10, tradeCaptor.getValue().getQuantity());

        assertEquals(0, buyOrder.getQuantity());
        assertEquals(OrderStatus.FILLED, buyOrder.getStatus());
        assertEquals(0, sellOrder.getQuantity());
        assertEquals(OrderStatus.FILLED, sellOrder.getStatus());
        verify(tradeRepository).save(any(Trade.class));
    }

    @Test
    void shouldLeaveOrdersUntouchedWhenSettlementFails() {
        OrderBook orderBook = new OrderBook();
        TradeRepository tradeRepository = mock(TradeRepository.class);
        OrderRepository orderRepository = mock(OrderRepository.class);
        SettlementService settlementService = mock(SettlementService.class);

        MatchingEngine matchingEngine = new MatchingEngine(
                orderBook,
                tradeRepository,
                orderRepository,
                settlementService
        );

        User buyer = new User();
        User seller = new User();
        Stock stock = new Stock();

        Order buyOrder = new Order(
                buyer, stock, new BigDecimal("100.00"), 10, OrderType.BUY
        );
        Order sellOrder = new Order(
                seller, stock, new BigDecimal("95.00"), 10, OrderType.SELL
        );

        orderBook.addOrder(buyOrder);
        orderBook.addOrder(sellOrder);

        doThrow(new RuntimeException("Settlement rejected"))
                .when(settlementService).settleTrade(any(Trade.class));

        assertThrows(RuntimeException.class, matchingEngine::match);

        assertEquals(10, buyOrder.getQuantity());
        assertEquals(10, sellOrder.getQuantity());
        assertEquals(OrderStatus.PENDING, buyOrder.getStatus());
        assertEquals(OrderStatus.PENDING, sellOrder.getStatus());
        assertEquals(buyOrder, orderBook.getBestBuy());
        assertEquals(sellOrder, orderBook.getBestSell());

        verify(tradeRepository, never()).save(any(Trade.class));
        verify(orderRepository, never()).save(any(Order.class));
    }


    @Test
    void shouldNeverMatchOrdersAcrossDifferentStocks() {
        OrderBook orderBook = new OrderBook();
        TradeRepository tradeRepository = mock(TradeRepository.class);
        OrderRepository orderRepository = mock(OrderRepository.class);

        MatchingEngine matchingEngine = new MatchingEngine(
                orderBook,
                tradeRepository,
                orderRepository
        );

        User buyerA = new User();
        User sellerA = new User();
        User buyerB = new User();
        User sellerB = new User();
        Stock stockA = new Stock();
        Stock stockB = new Stock();

        Order buyA = new Order(
                buyerA, stockA, new BigDecimal("100.00"), 10, OrderType.BUY
        );
        Order sellA = new Order(
                sellerA, stockA, new BigDecimal("95.00"), 10, OrderType.SELL
        );
        Order buyB = new Order(
                buyerB, stockB, new BigDecimal("80.00"), 10, OrderType.BUY
        );
        Order sellB = new Order(
                sellerB, stockB, new BigDecimal("70.00"), 10, OrderType.SELL
        );

        orderBook.addOrder(buyA);
        orderBook.addOrder(sellA);
        orderBook.addOrder(buyB);
        orderBook.addOrder(sellB);

        matchingEngine.match();

        ArgumentCaptor<Trade> tradeCaptor = ArgumentCaptor.forClass(Trade.class);
        verify(tradeRepository, times(2)).save(tradeCaptor.capture());

        for (Trade trade : tradeCaptor.getAllValues()) {
            assertEquals(
                    trade.getBuyOrder().getStock(),
                    trade.getSellOrder().getStock()
            );
            assertEquals(trade.getStock(), trade.getBuyOrder().getStock());
        }

        assertEquals(0, buyA.getQuantity());
        assertEquals(0, sellA.getQuantity());
        assertEquals(0, buyB.getQuantity());
        assertEquals(0, sellB.getQuantity());
    }

    @Test
    void shouldPartiallyFillBuyOrderAndSettleOnlyAvailableSellShares() {
        OrderBook orderBook = new OrderBook();
        TradeRepository tradeRepository = mock(TradeRepository.class);
        OrderRepository orderRepository = mock(OrderRepository.class);
        com.shadowexchange.repository.HoldingRepository holdingRepository =
                mock(com.shadowexchange.repository.HoldingRepository.class);
        com.shadowexchange.repository.UserRepository userRepository =
                mock(com.shadowexchange.repository.UserRepository.class);

        SettlementService settlementService =
                new SettlementService(holdingRepository, userRepository);
        MatchingEngine matchingEngine = new MatchingEngine(
                orderBook,
                tradeRepository,
                orderRepository,
                settlementService
        );

        User buyer = new User();
        buyer.setBalance(new BigDecimal("10000.00"));
        buyer.setReservedBalance(new BigDecimal("1000.00"));

        User seller = new User();
        seller.setBalance(new BigDecimal("5000.00"));
        seller.setReservedBalance(BigDecimal.ZERO);

        Stock stock = new Stock();
        stock.setSymbol("PART");
        stock.setCompanyName("Partial Fill Test");
        stock.setCurrentPrice(new BigDecimal("100.00"));

        java.time.LocalDateTime earlier = java.time.LocalDateTime.now().minusSeconds(2);
        Order buyOrder = new Order(
                buyer, stock, new BigDecimal("100.00"), 10, OrderType.BUY
        );
        buyOrder.setCreatedAt(earlier);

        Order sellOrder = new Order(
                seller, stock, new BigDecimal("95.00"), 4, OrderType.SELL
        );
        sellOrder.setCreatedAt(earlier.plusSeconds(1));

        com.shadowexchange.entity.Holding sellerHolding =
                new com.shadowexchange.entity.Holding(seller, stock, 4, 4);

        when(holdingRepository.findByUserAndStock(seller, stock))
                .thenReturn(java.util.Optional.of(sellerHolding));
        when(holdingRepository.findByUserAndStock(buyer, stock))
                .thenReturn(java.util.Optional.empty());

        orderBook.addOrder(buyOrder);
        orderBook.addOrder(sellOrder);

        matchingEngine.match();

        assertEquals(6, buyOrder.getQuantity());
        assertEquals(OrderStatus.PARTIALLY_FILLED, buyOrder.getStatus());
        assertEquals(0, sellOrder.getQuantity());
        assertEquals(OrderStatus.FILLED, sellOrder.getStatus());

        // Only 4 shares were traded at the buyer's $100 limit price.
        assertEquals(new BigDecimal("9600.00"), buyer.getBalance());
        assertEquals(new BigDecimal("600.00"), buyer.getReservedBalance());
        assertEquals(new BigDecimal("5400.00"), seller.getBalance());
        assertEquals(0, sellerHolding.getQuantity());
        assertEquals(0, sellerHolding.getReservedQuantity());

        verify(holdingRepository).save(argThat(holding ->
                holding.getUser() == buyer
                        && holding.getStock() == stock
                        && holding.getQuantity() == 4
        ));
        verify(holdingRepository).save(sellerHolding);
        verify(tradeRepository).save(argThat(trade ->
                trade.getQuantity() == 4
                        && trade.getPrice().compareTo(new BigDecimal("100.00")) == 0
        ));
        verify(orderRepository).save(buyOrder);
        verify(orderRepository).save(sellOrder);
    }

}
