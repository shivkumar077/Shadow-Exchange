package com.shadowexchange;

import com.shadowexchange.dto.HoldingResponse;
import com.shadowexchange.entity.Holding;
import com.shadowexchange.entity.Stock;
import com.shadowexchange.entity.User;
import com.shadowexchange.repository.HoldingRepository;
import com.shadowexchange.repository.UserRepository;
import com.shadowexchange.service.PortfolioService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PortfolioServiceTest {

    @Mock
    private HoldingRepository holdingRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PortfolioService portfolioService;

    @Test
    void shouldReturnPortfolioHoldingsForUser() {
        Long userId = 1L;
        when(userRepository.existsById(userId)).thenReturn(true);

        User user = new User();
        user.setId(userId);

        Stock nvda = new Stock();
        nvda.setId(10L);
        nvda.setSymbol("NVDA");
        nvda.setCompanyName("NVIDIA Corp");
        nvda.setCurrentPrice(new BigDecimal("120.50"));

        Holding holding = new Holding(user, nvda, 100);
        holding.setId(101L);
        holding.setReservedQuantity(25);

        when(holdingRepository.findByUserIdOrderByStockSymbolAsc(userId))
                .thenReturn(List.of(holding));

        List<HoldingResponse> portfolio = portfolioService.getPortfolio(userId);

        assertNotNull(portfolio);
        assertEquals(1, portfolio.size());

        HoldingResponse response = portfolio.get(0);
        assertEquals(101L, response.getId());
        assertEquals(10L, response.getStockId());
        assertEquals("NVDA", response.getSymbol());
        assertEquals("NVIDIA Corp", response.getCompanyName());
        assertEquals(new BigDecimal("120.50"), response.getCurrentPrice());
        assertEquals(100, response.getQuantity());
        assertEquals(25, response.getReservedQuantity());
        assertEquals(75, response.getAvailableQuantity());
        assertEquals(new BigDecimal("12050.00"), response.getMarketValue());

        verify(userRepository).existsById(userId);
        verify(holdingRepository).findByUserIdOrderByStockSymbolAsc(userId);
    }

    @Test
    void shouldThrowExceptionWhenUserDoesNotExist() {
        Long userId = 999L;
        when(userRepository.existsById(userId)).thenReturn(false);

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> portfolioService.getPortfolio(userId)
        );

        assertEquals("User not found", exception.getMessage());
        verify(userRepository).existsById(userId);
        verifyNoInteractions(holdingRepository);
    }

    @Test
    void shouldReturnEmptyPortfolioWhenUserHasNoHoldings() {
        Long userId = 2L;
        when(userRepository.existsById(userId)).thenReturn(true);
        when(holdingRepository.findByUserIdOrderByStockSymbolAsc(userId))
                .thenReturn(List.of());

        List<HoldingResponse> portfolio = portfolioService.getPortfolio(userId);

        assertNotNull(portfolio);
        assertTrue(portfolio.isEmpty());
        verify(userRepository).existsById(userId);
        verify(holdingRepository).findByUserIdOrderByStockSymbolAsc(userId);
    }
}
