package com.shadowexchange.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.StompWebSocketEndpointRegistration;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class WebSocketConfigTest {

    @Test
    @DisplayName("Verify default configuration registers /ws endpoint with localhost:5173")
    void defaultConfigurationRegistersWsEndpointWithLocalhost5173() {
        WebSocketConfig config = new WebSocketConfig();
        StompEndpointRegistry endpointRegistry = mock(StompEndpointRegistry.class);
        StompWebSocketEndpointRegistration registration = mock(StompWebSocketEndpointRegistration.class);

        when(endpointRegistry.addEndpoint("/ws")).thenReturn(registration);

        config.registerStompEndpoints(endpointRegistry);

        verify(endpointRegistry).addEndpoint("/ws");
        verify(registration).setAllowedOrigins("http://localhost:5173");
    }

    @Test
    @DisplayName("Verify custom comma-separated origins are parsed, trimmed, and configured")
    void customCommaSeparatedOriginsAreParsedAndTrimmed() {
        WebSocketConfig config = new WebSocketConfig(
                "https://shadow-exchange.vercel.app,  http://localhost:3000 , https://exchange.example.com"
        );
        StompEndpointRegistry endpointRegistry = mock(StompEndpointRegistry.class);
        StompWebSocketEndpointRegistration registration = mock(StompWebSocketEndpointRegistration.class);

        when(endpointRegistry.addEndpoint("/ws")).thenReturn(registration);

        config.registerStompEndpoints(endpointRegistry);

        verify(endpointRegistry).addEndpoint("/ws");
        verify(registration).setAllowedOrigins(
                "https://shadow-exchange.vercel.app",
                "http://localhost:3000",
                "https://exchange.example.com"
        );
    }

    @Test
    @DisplayName("Verify wildcard origin '*' is rejected and falls back to default")
    void wildcardOriginIsRejectedAndFallsBackToDefault() {
        WebSocketConfig config = new WebSocketConfig("*");
        StompEndpointRegistry endpointRegistry = mock(StompEndpointRegistry.class);
        StompWebSocketEndpointRegistration registration = mock(StompWebSocketEndpointRegistration.class);

        when(endpointRegistry.addEndpoint("/ws")).thenReturn(registration);

        config.registerStompEndpoints(endpointRegistry);

        verify(endpointRegistry).addEndpoint("/ws");
        verify(registration).setAllowedOrigins("http://localhost:5173");
    }

    @Test
    @DisplayName("Verify null, blank, or whitespace strings fall back to default origin")
    void nullOrBlankOriginFallsBackToDefault() {
        WebSocketConfig emptyConfig = new WebSocketConfig("   ");
        WebSocketConfig nullConfig = new WebSocketConfig(null);

        assertThat(emptyConfig.parseAllowedOrigins("   ")).containsExactly("http://localhost:5173");
        assertThat(nullConfig.parseAllowedOrigins(null)).containsExactly("http://localhost:5173");
    }

    @Test
    @DisplayName("Verify trailing commas and empty segments are cleanly ignored")
    void trailingCommasAndEmptySegmentsAreIgnored() {
        WebSocketConfig config = new WebSocketConfig(" https://app.example.com , , https://admin.example.com, ");
        List<String> origins = config.parseAllowedOrigins(" https://app.example.com , , https://admin.example.com, ");

        assertThat(origins).containsExactly("https://app.example.com", "https://admin.example.com");
    }

    @Test
    @DisplayName("Verify message broker configures simple broker /topic and application prefix /app")
    void configureMessageBrokerSetsTopicAndAppPrefixes() {
        WebSocketConfig config = new WebSocketConfig();
        MessageBrokerRegistry brokerRegistry = mock(MessageBrokerRegistry.class);

        config.configureMessageBroker(brokerRegistry);

        verify(brokerRegistry).enableSimpleBroker("/topic");
        verify(brokerRegistry).setApplicationDestinationPrefixes("/app");
    }
}
