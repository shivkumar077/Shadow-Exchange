package com.shadowexchange.websocket;

import com.shadowexchange.dto.PublicTradeResponse;
import com.shadowexchange.event.TradeExecutedEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.support.TransactionTemplate;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SpringJUnitConfig(TradeWebSocketPublisherTransactionTest.TestConfig.class)
class TradeWebSocketPublisherTransactionTest {

    @Configuration
    @EnableTransactionManagement
    static class TestConfig {

        @Bean
        public DataSource dataSource() {
            return new EmbeddedDatabaseBuilder()
                    .setType(EmbeddedDatabaseType.H2)
                    .generateUniqueName(true)
                    .build();
        }

        @Bean
        public PlatformTransactionManager transactionManager(DataSource dataSource) {
            return new DataSourceTransactionManager(dataSource);
        }

        @Bean
        public TransactionTemplate transactionTemplate(PlatformTransactionManager transactionManager) {
            return new TransactionTemplate(transactionManager);
        }

        @Bean
        public SimpMessagingTemplate messagingTemplate() {
            return mock(SimpMessagingTemplate.class);
        }

        @Bean
        public TradeWebSocketPublisher tradeWebSocketPublisher(SimpMessagingTemplate messagingTemplate) {
            return new TradeWebSocketPublisher(messagingTemplate);
        }
    }

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Autowired
    private TransactionTemplate transactionTemplate;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @BeforeEach
    void resetMock() {
        reset(messagingTemplate);
    }

    private PublicTradeResponse createSampleTrade() {
        return new PublicTradeResponse(
                200L,
                10L,
                "NVDA",
                new BigDecimal("125.00"),
                50,
                LocalDateTime.of(2026, 10, 13, 14, 0, 0)
        );
    }

    @Test
    void shouldBroadcastToTopicTradesOnlyAfterTransactionCommit() {
        PublicTradeResponse trade = createSampleTrade();

        transactionTemplate.execute(status -> {
            eventPublisher.publishEvent(new TradeExecutedEvent(trade));
            // Prior to commit, listener should NOT have executed yet
            verify(messagingTemplate, never()).convertAndSend(anyString(), any(Object.class));
            return null;
        });

        // After transaction commits successfully
        verify(messagingTemplate, times(1))
                .convertAndSend(eq("/topic/trades"), eq(trade));
    }

    @Test
    void shouldNotBroadcastWhenTransactionRollsBack() {
        PublicTradeResponse trade = createSampleTrade();

        try {
            transactionTemplate.execute(status -> {
                eventPublisher.publishEvent(new TradeExecutedEvent(trade));
                throw new RuntimeException("Simulated transaction failure causing rollback");
            });
        } catch (RuntimeException ignored) {
            // Expected rollback
        }

        // Listener must NOT broadcast because the transaction was rolled back
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Object.class));
    }

    @Test
    void shouldNotBroadcastWhenTransactionIsMarkedRollbackOnly() {
        PublicTradeResponse trade = createSampleTrade();

        transactionTemplate.execute(status -> {
            eventPublisher.publishEvent(new TradeExecutedEvent(trade));
            status.setRollbackOnly();
            return null;
        });

        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Object.class));
    }

    @Test
    void shouldNotBroadcastWhenEventPublishedWithoutActiveTransaction() {
        PublicTradeResponse trade = createSampleTrade();

        // Direct publication without transaction boundary
        // Because fallbackExecution = false, this must not fire
        eventPublisher.publishEvent(new TradeExecutedEvent(trade));

        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Object.class));
    }
}
