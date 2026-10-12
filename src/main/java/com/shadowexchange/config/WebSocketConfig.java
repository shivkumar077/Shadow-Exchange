package com.shadowexchange.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final String allowedOrigins;

    @Autowired
    public WebSocketConfig(
            @Value("${cors.allowed-origins:${CORS_ALLOWED_ORIGINS:http://localhost:5173}}") String allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    public WebSocketConfig() {
        this("http://localhost:5173");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        List<String> origins = parseAllowedOrigins(allowedOrigins);
        registry.addEndpoint("/ws")
                .setAllowedOrigins(origins.toArray(String[]::new));
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    List<String> parseAllowedOrigins(String rawOrigins) {
        if (rawOrigins == null || rawOrigins.isBlank()) {
            return List.of("http://localhost:5173");
        }
        List<String> parsed = Arrays.stream(rawOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty() && !origin.equals("*"))
                .toList();
        return parsed.isEmpty() ? List.of("http://localhost:5173") : parsed;
    }
}
