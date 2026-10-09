package com.shadowexchange;

import com.shadowexchange.dto.OrderRequestDTO;
import com.shadowexchange.entity.Holding;
import com.shadowexchange.entity.OrderType;
import com.shadowexchange.entity.Stock;
import com.shadowexchange.entity.User;
import com.shadowexchange.matching.MatchingEngine;
import com.shadowexchange.orderbook.OrderBook;
import com.shadowexchange.repository.HoldingRepository;
import com.shadowexchange.repository.OrderRepository;
import com.shadowexchange.repository.StockRepository;
import com.shadowexchange.repository.UserRepository;
import com.shadowexchange.service.OrderService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StockRepository stockRepository;

    @Mock
    private HoldingRepository holdingRepository;

    @Mock
    private OrderBook orderBook;

    @Mock
    private MatchingEngine matchingEngine;

    @InjectMocks
    private OrderService orderService;

    @Test
    void shouldRejectSellOrderWhenAvailableSharesAreInsufficient() {
        User seller = new User();
        seller.setBalance(new BigDecimal("5000.00"));
        seller.setReservedBalance(BigDecimal.ZERO);

        Stock stock = new Stock();
        Holding holding = new Holding(seller, stock, 100, 80);

        OrderRequestDTO request = new OrderRequestDTO();
        request.setUserId(1L);
        request.setStockId(1L);
        request.setPrice(new BigDecimal("100.00"));
        request.setQuantity(30);
        request.setType(OrderType.SELL);

        when(userRepository.findById(1L)).thenReturn(Optional.of(seller));
        when(stockRepository.findById(1L)).thenReturn(Optional.of(stock));
        when(holdingRepository.findByUserAndStock(seller, stock))
                .thenReturn(Optional.of(holding));

        assertThrows(RuntimeException.class, () -> orderService.createOrder(request));

        assertEquals(100, holding.getQuantity());
        assertEquals(80, holding.getReservedQuantity());

        verify(holdingRepository, never()).save(holding);
        verify(orderRepository, never()).save(any());
        verify(orderBook, never()).addOrder(any());
        verify(matchingEngine, never()).match();
    }

    @Test
    void shouldTrackReservedSharesAcrossMultipleSellOrders() {
        User seller = new User();
        seller.setBalance(new BigDecimal("5000.00"));
        seller.setReservedBalance(BigDecimal.ZERO);

        Stock stock = new Stock();
        Holding holding = new Holding(seller, stock, 100, 0);

        when(userRepository.findById(1L)).thenReturn(Optional.of(seller));
        when(stockRepository.findById(1L)).thenReturn(Optional.of(stock));
        when(holdingRepository.findByUserAndStock(seller, stock))
                .thenReturn(Optional.of(holding));
        when(orderRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        OrderRequestDTO firstOrder = new OrderRequestDTO();
        firstOrder.setUserId(1L);
        firstOrder.setStockId(1L);
        firstOrder.setPrice(new BigDecimal("100.00"));
        firstOrder.setQuantity(30);
        firstOrder.setType(OrderType.SELL);

        OrderRequestDTO secondOrder = new OrderRequestDTO();
        secondOrder.setUserId(1L);
        secondOrder.setStockId(1L);
        secondOrder.setPrice(new BigDecimal("100.00"));
        secondOrder.setQuantity(40);
        secondOrder.setType(OrderType.SELL);

        OrderRequestDTO thirdOrder = new OrderRequestDTO();
        thirdOrder.setUserId(1L);
        thirdOrder.setStockId(1L);
        thirdOrder.setPrice(new BigDecimal("100.00"));
        thirdOrder.setQuantity(31);
        thirdOrder.setType(OrderType.SELL);

        orderService.createOrder(firstOrder);
        assertEquals(30, holding.getReservedQuantity());

        orderService.createOrder(secondOrder);
        assertEquals(70, holding.getReservedQuantity());

        assertThrows(RuntimeException.class, () -> orderService.createOrder(thirdOrder));
        assertEquals(70, holding.getReservedQuantity());

        verify(matchingEngine, times(2)).match();
    }

    @Test
    void shouldReserveFundsWhenBuyOrderIsPlaced() {
        User buyer = new User();
        buyer.setBalance(new BigDecimal("10000.00"));
        buyer.setReservedBalance(new BigDecimal("1000.00"));

        Stock stock = new Stock();
        OrderRequestDTO request = new OrderRequestDTO();
        request.setUserId(1L);
        request.setStockId(1L);
        request.setPrice(new BigDecimal("100.00"));
        request.setQuantity(20);
        request.setType(OrderType.BUY);

        when(userRepository.findById(1L)).thenReturn(Optional.of(buyer));
        when(stockRepository.findById(1L)).thenReturn(Optional.of(stock));
        when(orderRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        orderService.createOrder(request);

        assertEquals(new BigDecimal("3000.00"), buyer.getReservedBalance());
        assertEquals(new BigDecimal("10000.00"), buyer.getBalance());

        verify(userRepository).save(buyer);
        verify(orderRepository).save(any());
        verify(orderBook).addOrder(any());
        verify(matchingEngine).match();
    }

    @Test
    void shouldRejectBuyOrderWhenAvailableFundsAreInsufficient() {
        User buyer = new User();
        buyer.setBalance(new BigDecimal("1000.00"));
        buyer.setReservedBalance(new BigDecimal("200.00"));

        Stock stock = new Stock();
        OrderRequestDTO request = new OrderRequestDTO();
        request.setUserId(1L);
        request.setStockId(1L);
        request.setPrice(new BigDecimal("100.00"));
        request.setQuantity(9);
        request.setType(OrderType.BUY);

        when(userRepository.findById(1L)).thenReturn(Optional.of(buyer));
        when(stockRepository.findById(1L)).thenReturn(Optional.of(stock));

        assertThrows(RuntimeException.class, () -> orderService.createOrder(request));

        assertEquals(new BigDecimal("1000.00"), buyer.getBalance());
        assertEquals(new BigDecimal("200.00"), buyer.getReservedBalance());

        verify(userRepository, never()).save(any());
        verify(orderRepository, never()).save(any());
        verify(orderBook, never()).addOrder(any());
        verify(matchingEngine, never()).match();
    }
}
