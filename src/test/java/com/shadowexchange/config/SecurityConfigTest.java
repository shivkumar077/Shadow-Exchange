package com.shadowexchange.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SecurityConfigTest {

    @Test
    @DisplayName("Verify default CORS configuration allows localhost:5173")
    void defaultCorsConfigurationAllowsLocalhost5173() {
        SecurityConfig securityConfig = new SecurityConfig();
        CorsConfigurationSource source = securityConfig.corsConfigurationSource();

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/stocks");
        CorsConfiguration config = source.getCorsConfiguration(request);

        assertThat(config).isNotNull();
        assertThat(config.getAllowedOrigins()).containsExactly("http://localhost:5173");
        assertThat(config.getAllowedMethods()).containsExactly("GET", "POST", "DELETE", "OPTIONS");
        assertThat(config.getAllowedHeaders()).containsExactly("Content-Type", "Authorization");
    }

    @Test
    @DisplayName("Verify custom comma-separated origins are parsed and trimmed")
    void customCommaSeparatedOriginsAreParsedAndTrimmed() {
        SecurityConfig securityConfig = new SecurityConfig(
                "https://shadow-exchange.vercel.app,  http://localhost:3000 , https://exchange.example.com"
        );
        CorsConfigurationSource source = securityConfig.corsConfigurationSource();

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/orders");
        CorsConfiguration config = source.getCorsConfiguration(request);

        assertThat(config).isNotNull();
        assertThat(config.getAllowedOrigins()).containsExactly(
                "https://shadow-exchange.vercel.app",
                "http://localhost:3000",
                "https://exchange.example.com"
        );
    }

    @Test
    @DisplayName("Verify wildcard origin '*' is rejected and falls back to default")
    void wildcardOriginIsRejectedAndFallsBackToDefault() {
        SecurityConfig securityConfig = new SecurityConfig("*");
        CorsConfigurationSource source = securityConfig.corsConfigurationSource();

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/stocks");
        CorsConfiguration config = source.getCorsConfiguration(request);

        assertThat(config).isNotNull();
        assertThat(config.getAllowedOrigins()).containsExactly("http://localhost:5173");
    }

    @Test
    @DisplayName("Verify null, blank, or whitespace strings fall back to default origin")
    void nullOrBlankOriginFallsBackToDefault() {
        SecurityConfig emptyConfig = new SecurityConfig("   ");
        SecurityConfig nullConfig = new SecurityConfig(null);

        assertThat(emptyConfig.parseAllowedOrigins("   ")).containsExactly("http://localhost:5173");
        assertThat(nullConfig.parseAllowedOrigins(null)).containsExactly("http://localhost:5173");
    }

    @Test
    @DisplayName("Verify trailing commas and empty segments are cleanly ignored")
    void trailingCommasAndEmptySegmentsAreIgnored() {
        SecurityConfig securityConfig = new SecurityConfig(" https://app.example.com , , https://admin.example.com, ");
        List<String> origins = securityConfig.parseAllowedOrigins(" https://app.example.com , , https://admin.example.com, ");

        assertThat(origins).containsExactly("https://app.example.com", "https://admin.example.com");
    }
}
