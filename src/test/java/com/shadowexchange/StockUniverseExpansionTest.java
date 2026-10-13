package com.shadowexchange;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shadowexchange.config.StockDataInitializer;
import com.shadowexchange.dto.OrderRequestDTO;
import com.shadowexchange.entity.Holding;
import com.shadowexchange.entity.OrderType;
import com.shadowexchange.entity.Stock;
import com.shadowexchange.entity.Trade;
import com.shadowexchange.entity.User;
import com.shadowexchange.repository.HoldingRepository;
import com.shadowexchange.repository.OrderRepository;
import com.shadowexchange.repository.StockRepository;
import com.shadowexchange.repository.TradeRepository;
import com.shadowexchange.repository.UserRepository;
import com.shadowexchange.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class StockUniverseExpansionTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private StockRepository stockRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HoldingRepository holdingRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private TradeRepository tradeRepository;

    @Autowired
    private StockDataInitializer stockDataInitializer;

    @Autowired
    private OrderService orderService;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void cleanState() {
        tradeRepository.deleteAll();
        orderRepository.deleteAll();
        holdingRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Initial seeding into an empty database seeds all 28 curated instruments")
    void testInitialSeedingIntoEmptyDatabase() {
        stockRepository.deleteAll();
        assertEquals(0, stockRepository.count());

        List<Stock> newlySeeded = stockDataInitializer.seedMissingStocks();
        assertEquals(28, newlySeeded.size());
        assertEquals(28, stockRepository.count());

        List<Stock> allStocks = stockRepository.findAllByOrderByIdAsc();
        assertEquals(28, allStocks.size());

        for (Stock stock : allStocks) {
            assertNotNull(stock.getId(), "Stock ID must not be null");
            assertNotNull(stock.getSymbol(), "Symbol must not be null");
            assertFalse(stock.getSymbol().isBlank(), "Symbol must not be blank");
            assertEquals(stock.getSymbol().toUpperCase(), stock.getSymbol(), "Symbol must be uppercase");
            assertNotNull(stock.getCompanyName(), "Company name must not be null");
            assertNotNull(stock.getCurrentPrice(), "Current price must not be null");
            assertTrue(stock.getCurrentPrice().compareTo(BigDecimal.ZERO) > 0, "Price must be positive");
        }
    }

    @Test
    @DisplayName("Incremental seeding into a database with original five stocks preserves existing records and IDs")
    void testIncrementalSeedingPreservesOriginalFiveAndTheirIds() {
        stockRepository.deleteAll();

        // Simulate an existing production database containing only the original 5 stocks
        List<Stock> originalFive = List.of(
                new Stock("NVDA", "NVIDIA Corporation", new BigDecimal("142.87")),
                new Stock("AAPL", "Apple Inc.", new BigDecimal("231.42")),
                new Stock("MSFT", "Microsoft Corporation", new BigDecimal("428.76")),
                new Stock("TSLA", "Tesla, Inc.", new BigDecimal("338.29")),
                new Stock("AMZN", "Amazon.com, Inc.", new BigDecimal("214.19"))
        );
        List<Stock> savedOriginals = stockRepository.saveAll(originalFive);
        assertEquals(5, savedOriginals.size());

        Map<String, Long> originalIdsBySymbol = savedOriginals.stream()
                .collect(Collectors.toMap(Stock::getSymbol, Stock::getId));

        // Create an associated holding referencing one of the original stocks (NVDA)
        User testUser = new User();
        testUser.setUsername("existing-operator");
        testUser.setEmail("operator@example.test");
        testUser.setPassword("password");
        testUser.setBalance(new BigDecimal("10000.00"));
        testUser.setReservedBalance(BigDecimal.ZERO);
        testUser = userRepository.save(testUser);

        Stock nvda = stockRepository.findBySymbol("NVDA").orElseThrow();
        Holding existingHolding = holdingRepository.save(new Holding(testUser, nvda, 25));

        // Run incremental seeding
        List<Stock> added = stockDataInitializer.seedMissingStocks();
        assertEquals(23, added.size(), "Should have added exactly 23 missing stocks");
        assertEquals(28, stockRepository.count(), "Total stock count should be 28");

        // Verify the original 5 stocks were NOT modified and retained exact IDs
        for (Map.Entry<String, Long> entry : originalIdsBySymbol.entrySet()) {
            Stock current = stockRepository.findBySymbol(entry.getKey()).orElseThrow();
            assertEquals(entry.getValue(), current.getId(),
                    "Existing stock ID for " + entry.getKey() + " must be strictly preserved");
        }

        // Verify existing holding and associated data remained intact
        Holding fetchedHolding = holdingRepository.findById(existingHolding.getId()).orElseThrow();
        assertEquals(25, fetchedHolding.getQuantity());
        assertEquals(nvda.getId(), fetchedHolding.getStock().getId());
    }

    @Test
    @DisplayName("Repeated executions of the initializer are completely idempotent without duplicates")
    void testRepeatedExecutionIsIdempotentAndCreatesNoDuplicates() {
        stockDataInitializer.seedMissingStocks();
        long countAfterFirst = stockRepository.count();
        assertEquals(28, countAfterFirst);

        // Run again
        List<Stock> secondRun = stockDataInitializer.seedMissingStocks();
        assertTrue(secondRun.isEmpty(), "Second run should not insert any stocks");
        assertEquals(28, stockRepository.count(), "Count must remain exactly 28");

        // Verify all 28 symbols are strictly unique
        Set<String> uniqueSymbols = stockRepository.findAll().stream()
                .map(Stock::getSymbol)
                .collect(Collectors.toSet());
        assertEquals(28, uniqueSymbols.size(), "All 28 symbols must be distinct");
    }

    @Test
    @DisplayName("Stock list API returns the complete 28-instrument universe with valid fields")
    void testStockListApiReturnsCompleteUniverse() throws Exception {
        stockDataInitializer.seedMissingStocks();

        mockMvc.perform(get("/api/stocks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", is(28)))
                .andExpect(jsonPath("$[0].symbol", is("NVDA")))
                .andExpect(jsonPath("$[1].symbol", is("AAPL")))
                .andExpect(jsonPath("$[2].symbol", is("MSFT")))
                .andExpect(jsonPath("$[3].symbol", is("TSLA")))
                .andExpect(jsonPath("$[4].symbol", is("AMZN")))
                .andExpect(jsonPath("$[*].symbol", hasItem("JPM")))
                .andExpect(jsonPath("$[*].symbol", hasItem("GOOGL")))
                .andExpect(jsonPath("$[*].symbol", hasItem("JNJ")))
                .andExpect(jsonPath("$[*].symbol", hasItem("COST")))
                .andExpect(jsonPath("$[*].symbol", hasItem("XOM")))
                .andExpect(jsonPath("$[*].symbol", hasItem("BA")));
    }

    @Test
    @DisplayName("Stock by ID endpoint returns specific instrument details and 404 for unknown ID")
    void testStockDetailsByIdEndpoint() throws Exception {
        stockDataInitializer.seedMissingStocks();
        Stock jpm = stockRepository.findBySymbol("JPM").orElseThrow();

        mockMvc.perform(get("/api/stocks/" + jpm.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(jpm.getId().intValue())))
                .andExpect(jsonPath("$.symbol", is("JPM")))
                .andExpect(jsonPath("$.companyName", is("JPMorgan Chase & Co.")))
                .andExpect(jsonPath("$.currentPrice", is(224.50)));

        mockMvc.perform(get("/api/stocks/999999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("End-to-end order placement, matching, and settlement works for an added instrument")
    void testOrderPlacementMatchingAndSettlementForAddedInstrument() {
        stockDataInitializer.seedMissingStocks();
        Stock jpm = stockRepository.findBySymbol("JPM").orElseThrow();

        // Create Buyer
        User buyer = new User();
        buyer.setUsername("jpm-buyer");
        buyer.setEmail("jpm-buyer@example.test");
        buyer.setPassword("pass");
        buyer.setBalance(new BigDecimal("10000.00"));
        buyer.setReservedBalance(BigDecimal.ZERO);
        buyer = userRepository.save(buyer);

        // Create Seller
        User seller = new User();
        seller.setUsername("jpm-seller");
        seller.setEmail("jpm-seller@example.test");
        seller.setPassword("pass");
        seller.setBalance(new BigDecimal("2000.00"));
        seller.setReservedBalance(BigDecimal.ZERO);
        seller = userRepository.save(seller);

        // Give seller 50 shares of JPM
        holdingRepository.save(new Holding(seller, jpm, 50));

        // 1. Seller posts limit sell order for 10 shares of JPM at $220.00
        OrderRequestDTO sellRequest = new OrderRequestDTO();
        sellRequest.setUserId(seller.getId());
        sellRequest.setStockId(jpm.getId());
        sellRequest.setType(OrderType.SELL);
        sellRequest.setPrice(new BigDecimal("220.00"));
        sellRequest.setQuantity(10);
        orderService.createOrder(sellRequest);

        // 2. Buyer posts matching limit buy order for 10 shares of JPM at $220.00
        OrderRequestDTO buyRequest = new OrderRequestDTO();
        buyRequest.setUserId(buyer.getId());
        buyRequest.setStockId(jpm.getId());
        buyRequest.setType(OrderType.BUY);
        buyRequest.setPrice(new BigDecimal("220.00"));
        buyRequest.setQuantity(10);
        orderService.createOrder(buyRequest);

        // 3. Verify trade executed and settled
        List<Trade> trades = tradeRepository.findAll();
        assertEquals(1, trades.size(), "One trade should have been recorded");
        Trade trade = trades.get(0);
        assertEquals(jpm.getId(), trade.getStock().getId());
        assertEquals("JPM", trade.getStock().getSymbol());
        assertEquals(10, trade.getQuantity());
        assertEquals(new BigDecimal("220.00"), trade.getPrice());

        // Buyer balance: 10000 - 2200 = 7800
        User updatedBuyer = userRepository.findById(buyer.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("7800.00").compareTo(updatedBuyer.getBalance()));
        assertEquals(0, BigDecimal.ZERO.compareTo(updatedBuyer.getReservedBalance()));

        // Buyer holding: 10 JPM shares
        Holding buyerHolding = holdingRepository.findByUserAndStock(updatedBuyer, jpm).orElseThrow();
        assertEquals(10, buyerHolding.getQuantity());
        assertEquals(0, buyerHolding.getReservedQuantity());

        // Seller balance: 2000 + 2200 = 4200
        User updatedSeller = userRepository.findById(seller.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("4200.00").compareTo(updatedSeller.getBalance()));
        assertEquals(0, BigDecimal.ZERO.compareTo(updatedSeller.getReservedBalance()));

        // Seller holding: 50 - 10 = 40 JPM shares
        Holding sellerHolding = holdingRepository.findByUserAndStock(updatedSeller, jpm).orElseThrow();
        assertEquals(40, sellerHolding.getQuantity());
        assertEquals(0, sellerHolding.getReservedQuantity());
    }
}
