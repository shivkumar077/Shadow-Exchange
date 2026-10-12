package com.shadowexchange.websocket;

import com.shadowexchange.event.TradeExecutedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class TradeWebSocketPublisher {

    private static final Logger log = LoggerFactory.getLogger(TradeWebSocketPublisher.class);
    public static final String TRADES_TOPIC = "/topic/trades";

    private final SimpMessagingTemplate messagingTemplate;

    public TradeWebSocketPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = false)
    public void handleTradeExecuted(TradeExecutedEvent event) {
        if (event == null || event.getTrade() == null) {
            return;
        }

        log.debug("Publishing trade {} on symbol {} to {}",
                event.getTrade().getTradeId(),
                event.getTrade().getSymbol(),
                TRADES_TOPIC);

        messagingTemplate.convertAndSend(TRADES_TOPIC, event.getTrade());
    }
}
