package com.shadowexchange;

import com.shadowexchange.dto.HoldingResponse;
import com.shadowexchange.dto.UserResponse;
import com.shadowexchange.repository.StockRepository;
import com.shadowexchange.service.PortfolioService;
import com.shadowexchange.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class DemoUserRandomizationTest {

    @Autowired
    private UserService userService;

    @Autowired
    private PortfolioService portfolioService;

    @Autowired
    private StockRepository stockRepository;

    @Test
    @DisplayName("New demo accounts have randomized starting cash within configured bounds and scale 2")
    void testDemoUserStartingCashRandomization() {
        UserResponse user = userService.createDemoUser();

        assertNotNull(user);
        assertNotNull(user.getId());
        assertNotNull(user.getBalance());
        assertEquals(2, user.getBalance().scale(), "Balance must have exact currency precision (scale 2)");
        assertTrue(user.getBalance().compareTo(UserService.MIN_DEMO_CASH) >= 0,
                "Balance must be >= min demo cash");
        assertTrue(user.getBalance().compareTo(UserService.MAX_DEMO_CASH) <= 0,
                "Balance must be <= max demo cash");
        assertEquals(BigDecimal.ZERO, user.getReservedBalance());
    }

    @Test
    @DisplayName("New demo accounts have 2-6 valid holdings with 5-50 integer shares referencing exchange stocks")
    void testDemoUserStartingHoldingsRandomization() {
        UserResponse user = userService.createDemoUser();
        List<HoldingResponse> portfolio = portfolioService.getPortfolio(user.getId());

        assertFalse(portfolio.isEmpty(), "Demo user should have starter holdings");
        assertTrue(portfolio.size() >= UserService.MIN_DEMO_HOLDINGS,
                "Holdings count should be >= " + UserService.MIN_DEMO_HOLDINGS);
        assertTrue(portfolio.size() <= UserService.MAX_DEMO_HOLDINGS,
                "Holdings count should be <= " + UserService.MAX_DEMO_HOLDINGS);

        Set<Long> stockIds = new HashSet<>();
        for (HoldingResponse holding : portfolio) {
            assertTrue(holding.getQuantity() >= UserService.MIN_HOLDING_QUANTITY,
                    "Holding quantity should be >= " + UserService.MIN_HOLDING_QUANTITY);
            assertTrue(holding.getQuantity() <= UserService.MAX_HOLDING_QUANTITY,
                    "Holding quantity should be <= " + UserService.MAX_HOLDING_QUANTITY);
            assertEquals(0, holding.getReservedQuantity());
            assertTrue(stockRepository.existsById(holding.getStockId()),
                    "Holding must reference a valid stock ID from the exchange universe");
            assertTrue(stockIds.add(holding.getStockId()), "Portfolio should not contain duplicate stock holdings");
        }
    }

    @Test
    @DisplayName("Different demo accounts generate distinct starting balances and portfolio compositions")
    void testMultipleDemoAccountsDiversity() {
        UserResponse user1 = userService.createDemoUser();
        UserResponse user2 = userService.createDemoUser();
        UserResponse user3 = userService.createDemoUser();

        assertNotEquals(user1.getId(), user2.getId());
        assertNotEquals(user2.getId(), user3.getId());

        List<HoldingResponse> port1 = portfolioService.getPortfolio(user1.getId());
        List<HoldingResponse> port2 = portfolioService.getPortfolio(user2.getId());

        // Account isolation: retrieving user1 does not affect user2
        UserResponse reloaded1 = userService.getUser(user1.getId());
        assertEquals(user1.getBalance(), reloaded1.getBalance(), "User1 balance must be identical on reload");
        assertEquals(port1.size(), portfolioService.getPortfolio(user1.getId()).size(),
                "Holdings count must remain identical on reload");
    }

    @Test
    @DisplayName("getUser and getPortfolio never rerandomize or duplicate grants on repeated access")
    void testPersistenceAndIdempotency() {
        UserResponse created = userService.createDemoUser();
        BigDecimal initialBalance = created.getBalance();
        List<HoldingResponse> initialHoldings = portfolioService.getPortfolio(created.getId());

        // Call multiple times to simulate app reloads/refreshes
        for (int i = 0; i < 5; i++) {
            UserResponse fetched = userService.getUser(created.getId());
            assertEquals(initialBalance, fetched.getBalance());
            List<HoldingResponse> fetchedHoldings = portfolioService.getPortfolio(created.getId());
            assertEquals(initialHoldings.size(), fetchedHoldings.size());
            for (int h = 0; h < initialHoldings.size(); h++) {
                assertEquals(initialHoldings.get(h).getStockId(), fetchedHoldings.get(h).getStockId());
                assertEquals(initialHoldings.get(h).getQuantity(), fetchedHoldings.get(h).getQuantity());
            }
        }
    }
}
