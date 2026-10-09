package com.shadowexchange;

import com.shadowexchange.entity.Holding;
import com.shadowexchange.entity.Order;
import com.shadowexchange.entity.OrderStatus;
import com.shadowexchange.entity.OrderType;
import com.shadowexchange.entity.Stock;
import com.shadowexchange.entity.User;
import com.shadowexchange.orderbook.OrderBook;
import com.shadowexchange.repository.HoldingRepository;
import com.shadowexchange.repository.OrderRepository;
import com.shadowexchange.repository.UserRepository;
import com.shadowexchange.service.OrderCancellationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderCancellationServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderBook orderBook;

    @Mock
    private UserRepository userRepository;

    @Mock
    private HoldingRepository holdingRepository;

    @InjectMocks
    private OrderCancellationService cancellationService;

    @Test
    void shouldReleaseReservedSharesWhenSellOrderIsCancelled() {

        User seller = new User();
        seller.setBalance(new BigDecimal("5000.00"));

        Stock stock = new Stock();

        Holding holding = new Holding(
                seller,
                stock,
                100,
                30
        );

        Order sellOrder = new Order(
                seller,
                stock,
                new BigDecimal("100.00"),
                30,
                OrderType.SELL
        );

        when(orderRepository.findById(1L))
                .thenReturn(Optional.of(sellOrder));

        when(orderBook.removeOrder(sellOrder))
                .thenReturn(true);

        when(holdingRepository.findByUserAndStock(seller, stock))
                .thenReturn(Optional.of(holding));

        cancellationService.cancelOrder(1L);

        assertEquals(100, holding.getQuantity());
        assertEquals(0, holding.getReservedQuantity());
        assertEquals(OrderStatus.CANCELLED, sellOrder.getStatus());

        verify(holdingRepository).save(holding);
        verify(orderRepository).save(sellOrder);
    }
}
