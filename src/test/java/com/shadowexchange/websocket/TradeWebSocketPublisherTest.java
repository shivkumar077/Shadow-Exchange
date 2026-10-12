package com.shadowexchange.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.shadowexchange.dto.PublicTradeResponse;
import com.shadowexchange.event.TradeExecutedEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

class TradeWebSocketPublisherTest {

    private SimpMessagingTemplate messagingTemplate;
    private TradeWebSocketPublisher publisher;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        messagingTemplate = mock(SimpMessagingTemplate.class);
        publisher = new TradeWebSocketPublisher(messagingTemplate);
        objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    }

    @Test
    void shouldBroadcastToTopicTradesWhenEventReceived() {
        LocalDateTime executedAt = LocalDateTime.of(2026, 10, 13, 10, 30, 0);
        PublicTradeResponse trade = new PublicTradeResponse(
                101L,
                1L,
                "AAPL",
                new BigDecimal("150.50"),
                25,
                executedAt
        );

        publisher.handleTradeExecuted(new TradeExecutedEvent(trade));

        verify(messagingTemplate, times(1))
                .convertAndSend("/topic/trades", trade);
    }

    @Test
    void shouldIgnoreNullEventOrNullTradePayloadGracefully() {
        publisher.handleTradeExecuted(null);
        verifyNoInteractions(messagingTemplate);

        PublicTradeResponse nullTrade = null;
        // Construct event if allowed, or test handleTradeExecuted null-safety
        publisher.handleTradeExecuted(new TradeExecutedEvent(new PublicTradeResponse(1L, 1L, "AAPL", BigDecimal.ONE, 1, LocalDateTime.now())) {
            @Override
            public PublicTradeResponse getTrade() {
                return null;
            }
        });
        verifyNoInteractions(messagingTemplate);
    }

    @Test
    void serializedPublicDtoContainsOnlyExpectedFieldsAndExcludesSensitiveData() throws Exception {
        LocalDateTime executedAt = LocalDateTime.of(2026, 10, 13, 12, 0, 0);
        PublicTradeResponse trade = new PublicTradeResponse(
                42L,
                5L,
                "TSLA",
                new BigDecimal("220.00"),
                100,
                executedAt
        );

        String json = objectMapper.writeValueAsString(trade);
        JsonNode node = objectMapper.readTree(json);

        // Required 6 fields
        assertTrue(node.has("tradeId"));
        assertTrue(node.has("stockId"));
        assertTrue(node.has("symbol"));
        assertTrue(node.has("price"));
        assertTrue(node.has("quantity"));
        assertTrue(node.has("executedAt"));

        assertEquals(42, node.get("tradeId").asLong());
        assertEquals(5, node.get("stockId").asLong());
        assertEquals("TSLA", node.get("symbol").asText());
        assertEquals(220.0, node.get("price").asDouble());
        assertEquals(100, node.get("quantity").asInt());
        assertEquals("2026-10-13T12:00:00", node.get("executedAt").asText());

        // Exactly 6 fields
        assertEquals(6, node.size(), "PublicTradeResponse must only have exactly 6 serialized fields");

        // Explicitly check for absence of sensitive / internal entities
        assertFalse(node.has("buyer"));
        assertFalse(node.has("seller"));
        assertFalse(node.has("userId"));
        assertFalse(node.has("buyerId"));
        assertFalse(node.has("sellerId"));
        assertFalse(node.has("email"));
        assertFalse(node.has("password"));
        assertFalse(node.has("balance"));
        assertFalse(node.has("balances"));
        assertFalse(node.has("reservedBalance"));
        assertFalse(node.has("buyOrder"));
        assertFalse(node.has("sellOrder"));
        assertFalse(node.has("order"));
    }
}
