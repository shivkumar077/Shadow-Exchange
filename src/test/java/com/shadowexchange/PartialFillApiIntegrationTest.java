package com.shadowexchange;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shadowexchange.entity.Holding;
import com.shadowexchange.entity.Stock;
import com.shadowexchange.entity.User;
import com.shadowexchange.repository.HoldingRepository;
import com.shadowexchange.repository.OrderRepository;
import com.shadowexchange.repository.StockRepository;
import com.shadowexchange.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class PartialFillApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StockRepository stockRepository;

    @Autowired
    private HoldingRepository holdingRepository;

    @Autowired
    private OrderRepository orderRepository;

    private User buyer;
    private User seller;
    private Stock stock;

    @BeforeEach
    void setUp() {
        holdingRepository.deleteAll();
        orderRepository.deleteAll();
        stockRepository.deleteAll();
        userRepository.deleteAll();

        buyer = new User();
        buyer.setUsername("partial-fill-buyer");
        buyer.setEmail("partial-buyer@example.test");
        buyer.setPassword("test-only");
        buyer.setBalance(new BigDecimal("10000.00"));
        buyer.setReservedBalance(BigDecimal.ZERO);
        buyer = userRepository.save(buyer);

        seller = new User();
        seller.setUsername("partial-fill-seller");
        seller.setEmail("partial-seller@example.test");
        seller.setPassword("test-only");
        seller.setBalance(new BigDecimal("5000.00"));
        seller.setReservedBalance(BigDecimal.ZERO);
        seller = userRepository.save(seller);

        stock = stockRepository.save(new Stock(
                "PFT",
                "Partial Fill Test",
                new BigDecimal("100.00")
        ));

        holdingRepository.save(new Holding(seller, stock, 4));
    }


    @Test
    void shouldReturnEmptyOrderBookWhenNoOpenOrdersExist() throws Exception {
        mockMvc.perform(get("/orders/book/{stockId}", stock.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stockId").value(stock.getId()))
                .andExpect(jsonPath("$.bids.length()").value(0))
                .andExpect(jsonPath("$.asks.length()").value(0));
    }

    @Test
    void shouldSortBidsHighestFirstAndAsksLowestFirst() throws Exception {
        // These prices deliberately do not cross, so the orders stay open.
        placeOrder(buyer.getId(), "BUY", "90.00", 1);
        placeOrder(buyer.getId(), "BUY", "95.00", 1);
        placeOrder(buyer.getId(), "BUY", "92.00", 1);

        placeOrder(seller.getId(), "SELL", "110.00", 1);
        placeOrder(seller.getId(), "SELL", "105.00", 1);
        placeOrder(seller.getId(), "SELL", "108.00", 1);

        mockMvc.perform(get("/orders/book/{stockId}", stock.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bids.length()").value(3))
                .andExpect(jsonPath("$.bids[0].price").value(95.0))
                .andExpect(jsonPath("$.bids[1].price").value(92.0))
                .andExpect(jsonPath("$.bids[2].price").value(90.0))
                .andExpect(jsonPath("$.asks.length()").value(3))
                .andExpect(jsonPath("$.asks[0].price").value(105.0))
                .andExpect(jsonPath("$.asks[1].price").value(108.0))
                .andExpect(jsonPath("$.asks[2].price").value(110.0));
    }

    private void placeOrder(Long userId, String type, String price, int quantity)
            throws Exception {
        mockMvc.perform(post("/orders")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "userId": %d,
                                  "stockId": %d,
                                  "type": "%s",
                                  "price": %s,
                                  "quantity": %d
                                }
                                """.formatted(
                                userId, stock.getId(), type, price, quantity
                        )))
                .andExpect(status().isOk());
    }


    @Test
    void shouldExposeOpenBuyAndSellOrdersThroughOrderBookApi() throws Exception {
        mockMvc.perform(post("/orders")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "userId": %d,
                                  "stockId": %d,
                                  "type": "BUY",
                                  "price": 90.00,
                                  "quantity": 2
                                }
                                """.formatted(buyer.getId(), stock.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"));

        mockMvc.perform(post("/orders")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "userId": %d,
                                  "stockId": %d,
                                  "type": "SELL",
                                  "price": 100.00,
                                  "quantity": 3
                                }
                                """.formatted(seller.getId(), stock.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"));

        mockMvc.perform(get("/orders/book/{stockId}", stock.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stockId").value(stock.getId()))
                .andExpect(jsonPath("$.bids.length()").value(1))
                .andExpect(jsonPath("$.bids[0].type").value("BUY"))
                .andExpect(jsonPath("$.bids[0].price").value(90.0))
                .andExpect(jsonPath("$.bids[0].quantity").value(2))
                .andExpect(jsonPath("$.bids[0].status").value("PENDING"))
                .andExpect(jsonPath("$.asks.length()").value(1))
                .andExpect(jsonPath("$.asks[0].type").value("SELL"))
                .andExpect(jsonPath("$.asks[0].price").value(100.0))
                .andExpect(jsonPath("$.asks[0].quantity").value(3))
                .andExpect(jsonPath("$.asks[0].status").value("PENDING"));
    }

    @Test
    void shouldReturnAndPersistPartiallyFilledOrderThroughHttpApi() throws Exception {
        // First, place a SELL order for only four shares.
        mockMvc.perform(post("/orders")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "userId": %d,
                                  "stockId": %d,
                                  "type": "SELL",
                                  "price": 95.00,
                                  "quantity": 4
                                }
                                """.formatted(seller.getId(), stock.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.quantity").value(4));

        // Then request ten shares. Four should execute; six should remain open.
        MvcResult buyResult = mockMvc.perform(post("/orders")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "userId": %d,
                                  "stockId": %d,
                                  "type": "BUY",
                                  "price": 100.00,
                                  "quantity": 10
                                }
                                """.formatted(buyer.getId(), stock.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PARTIALLY_FILLED"))
                .andExpect(jsonPath("$.quantity").value(6))
                .andReturn();

        JsonNode buyResponse = objectMapper.readTree(
                buyResult.getResponse().getContentAsString()
        );
        long buyOrderId = buyResponse.get("id").asLong();

        // Confirm the API's GET endpoint returns the persisted remainder/status.
        mockMvc.perform(get("/orders/user/{userId}", buyer.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(buyOrderId))
                .andExpect(jsonPath("$[0].status").value("PARTIALLY_FILLED"))
                .andExpect(jsonPath("$[0].quantity").value(6));

        // The order book must expose the unfilled remainder, not the original quantity.
        mockMvc.perform(get("/orders/book/{stockId}", stock.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bids.length()").value(1))
                .andExpect(jsonPath("$.bids[0].id").value(buyOrderId))
                .andExpect(jsonPath("$.bids[0].status").value("PARTIALLY_FILLED"))
                .andExpect(jsonPath("$.bids[0].quantity").value(6))
                .andExpect(jsonPath("$.asks.length()").value(0));

        User persistedBuyer = userRepository.findById(buyer.getId()).orElseThrow();
        User persistedSeller = userRepository.findById(seller.getId()).orElseThrow();
        Holding buyerHolding = holdingRepository
                .findByUserAndStock(persistedBuyer, stock).orElseThrow();
        Holding sellerHolding = holdingRepository
                .findByUserAndStock(persistedSeller, stock).orElseThrow();

        assertEquals(new BigDecimal("9620.00"), persistedBuyer.getBalance());
        assertEquals(new BigDecimal("600.00"), persistedBuyer.getReservedBalance());
        assertEquals(new BigDecimal("5380.00"), persistedSeller.getBalance());
        assertEquals(4, buyerHolding.getQuantity());
        assertEquals(0, sellerHolding.getQuantity());
        assertEquals(0, sellerHolding.getReservedQuantity());
    }
}
