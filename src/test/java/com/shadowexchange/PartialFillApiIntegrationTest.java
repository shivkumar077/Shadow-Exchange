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
