package com.shadowexchange;

import com.shadowexchange.entity.*;
import com.shadowexchange.repository.HoldingRepository;
import com.shadowexchange.repository.UserRepository;
import com.shadowexchange.service.SettlementService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SettlementServiceTest {

    @Mock
    private HoldingRepository holdingRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private SettlementService settlementService;

    @Test
    void shouldSettleTradeCorrectly() {

        User buyer = new User();
        buyer.setBalance(new BigDecimal("10000.00"));
        buyer.setReservedBalance(new BigDecimal("2000.00"));

        User seller = new User();
        seller.setBalance(new BigDecimal("5000.00"));
        seller.setReservedBalance(BigDecimal.ZERO);

        Stock stock = new Stock();

        Order buyOrder = new Order(
                buyer,
                stock,
                new BigDecimal("100.00"),
                20,
                OrderType.BUY
        );

        Order sellOrder = new Order(
                seller,
                stock,
                new BigDecimal("95.00"),
                20,
                OrderType.SELL
        );

        Holding buyerHolding = new Holding(
                buyer,
                stock,
                10
        );

        Holding sellerHolding = new Holding(
                seller,
                stock,
                50,
                20
        );

        Trade trade = new Trade(
                buyer,
                seller,
                stock,
                new BigDecimal("95.00"),
                20,
                buyOrder,
                sellOrder
        );


        when(holdingRepository.findByUserAndStock(buyer, stock))
                .thenReturn(Optional.of(buyerHolding));

        when(holdingRepository.findByUserAndStock(seller, stock))
                .thenReturn(Optional.of(sellerHolding));

        settlementService.settleTrade(trade);

        assertEquals(
                new BigDecimal("8100.00"),
                buyer.getBalance()
        );

        assertEquals(
                new BigDecimal("0.00"),
                buyer.getReservedBalance()
        );

        assertEquals(
                new BigDecimal("6900.00"),
                seller.getBalance()
        );

        assertEquals(30, buyerHolding.getQuantity());
        assertEquals(30, sellerHolding.getQuantity());
        assertEquals(0, sellerHolding.getReservedQuantity());

        verify(userRepository).save(buyer);
        verify(userRepository).save(seller);

        verify(holdingRepository).save(buyerHolding);
        verify(holdingRepository).save(sellerHolding);
    }

    @Test
    void shouldRejectTradeWhenSellerDoesNotHaveEnoughShares() {

        User buyer = new User();
        buyer.setBalance(new BigDecimal("10000.00"));
        buyer.setReservedBalance(new BigDecimal("2000.00"));

        User seller = new User();
        seller.setBalance(new BigDecimal("5000.00"));
        seller.setReservedBalance(BigDecimal.ZERO);

        Stock stock = new Stock();

        Order buyOrder = new Order(
                buyer,
                stock,
                new BigDecimal("100.00"),
                20,
                OrderType.BUY
        );

        Order sellOrder = new Order(
                seller,
                stock,
                new BigDecimal("95.00"),
                20,
                OrderType.SELL
        );

        Holding sellerHolding = new Holding(
                seller,
                stock,
                10
        );

        Trade trade = new Trade(
                buyer,
                seller,
                stock,
                new BigDecimal("95.00"),
                20,
                buyOrder,
                sellOrder
        );

        when(holdingRepository.findByUserAndStock(seller, stock))
                .thenReturn(Optional.of(sellerHolding));

        assertThrows(
                RuntimeException.class,
                () -> settlementService.settleTrade(trade)
        );

    }

    @Test
    void shouldRejectTradeWhenSellerHasNoHolding() {

        User buyer = new User();
        buyer.setBalance(new BigDecimal("10000.00"));
        buyer.setReservedBalance(new BigDecimal("2000.00"));

        User seller = new User();
        seller.setBalance(new BigDecimal("5000.00"));
        seller.setReservedBalance(BigDecimal.ZERO);

        Stock stock = new Stock();

        Order buyOrder = new Order(
                buyer,
                stock,
                new BigDecimal("100.00"),
                20,
                OrderType.BUY
        );

        Order sellOrder = new Order(
                seller,
                stock,
                new BigDecimal("95.00"),
                20,
                OrderType.SELL
        );

        Trade trade = new Trade(
                buyer,
                seller,
                stock,
                new BigDecimal("95.00"),
                20,
                buyOrder,
                sellOrder
        );

        when(holdingRepository.findByUserAndStock(seller, stock))
                .thenReturn(Optional.empty());

        assertThrows(
                RuntimeException.class,
                () -> settlementService.settleTrade(trade)
        );
    }

    @Test
    void shouldKeepReservationsForUnfilledRemainderAfterPartialSettlement() {
        User buyer = new User();
        buyer.setBalance(new BigDecimal("10000.00"));
        buyer.setReservedBalance(new BigDecimal("10000.00"));

        User seller = new User();
        seller.setBalance(new BigDecimal("5000.00"));
        seller.setReservedBalance(BigDecimal.ZERO);

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
                new BigDecimal("90.00"),
                100,
                OrderType.SELL
        );

        Holding buyerHolding = new Holding(
                buyer,
                stock,
                10
        );

        Holding sellerHolding = new Holding(
                seller,
                stock,
                100,
                100
        );

        Trade partialTrade = new Trade(
                buyer,
                seller,
                stock,
                new BigDecimal("95.00"),
                40,
                buyOrder,
                sellOrder
        );

        when(holdingRepository.findByUserAndStock(buyer, stock))
                .thenReturn(Optional.of(buyerHolding));
        when(holdingRepository.findByUserAndStock(seller, stock))
                .thenReturn(Optional.of(sellerHolding));

        settlementService.settleTrade(partialTrade);

        // 40 shares cost 40 * 95 = 3,800.
        assertEquals(new BigDecimal("6200.00"), buyer.getBalance());

        // 40 * 100 = 4,000 is released from the BUY reservation;
        // 6,000 remains reserved for the unfilled 60 shares.
        assertEquals(new BigDecimal("6000.00"), buyer.getReservedBalance());

        assertEquals(new BigDecimal("8800.00"), seller.getBalance());

        assertEquals(50, buyerHolding.getQuantity());
        assertEquals(60, sellerHolding.getQuantity());

        // The seller's remaining 60 shares stay reserved for the open SELL order.
        assertEquals(60, sellerHolding.getReservedQuantity());

        verify(userRepository).save(buyer);
        verify(userRepository).save(seller);
        verify(holdingRepository).save(buyerHolding);
        verify(holdingRepository).save(sellerHolding);
    }

}
