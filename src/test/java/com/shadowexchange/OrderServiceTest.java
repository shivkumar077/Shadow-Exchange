package com.shadowexchange;

import com.shadowexchange.dto.OrderRequestDTO;
import com.shadowexchange.entity.Holding;
import com.shadowexchange.entity.OrderType;
import com.shadowexchange.entity.Stock;
import com.shadowexchange.entity.User;
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

    @InjectMocks
    private OrderService orderService;

    @Test
    void shouldRejectSellOrderWhenAvailableSharesAreInsufficient() {

        User seller = new User();
        seller.setBalance(new BigDecimal("5000.00"));
        seller.setReservedBalance(BigDecimal.ZERO);

        Stock stock = new Stock();

        Holding holding = new Holding(
                seller,
                stock,
                100,
                80
        );

        OrderRequestDTO request = new OrderRequestDTO();
        request.setUserId(1L);
        request.setStockId(1L);
        request.setPrice(new BigDecimal("100.00"));
        request.setQuantity(30);
        request.setType(OrderType.SELL);

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(seller));

        when(stockRepository.findById(1L))
                .thenReturn(Optional.of(stock));

        when(holdingRepository.findByUserAndStock(seller, stock))
                .thenReturn(Optional.of(holding));

        assertThrows(
                RuntimeException.class,
                () -> orderService.createOrder(request)
        );

        assertEquals(100, holding.getQuantity());
        assertEquals(80, holding.getReservedQuantity());

        verify(holdingRepository, never()).save(holding);
        verify(orderRepository, never()).save(any());
        verify(orderBook, never()).addOrder(any());
    }
}