package com.shadowexchange.config;

import com.shadowexchange.security.CustomOidcUserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.OrRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

@Configuration
public class SecurityConfig {

    private final String allowedOrigins;
    private final String frontendUrl;
    private final CustomOidcUserService customOidcUserService;

    @Autowired
    public SecurityConfig(
            @Value("${cors.allowed-origins:${CORS_ALLOWED_ORIGINS:http://localhost:5173}}") String allowedOrigins,
            @Value("${app.frontend-url:${APP_FRONTEND_URL:http://localhost:5173}}") String frontendUrl,
            @Autowired(required = false) CustomOidcUserService customOidcUserService) {
        this.allowedOrigins = allowedOrigins;
        this.frontendUrl = frontendUrl;
        this.customOidcUserService = customOidcUserService;
    }

    public SecurityConfig(String allowedOrigins) {
        this(allowedOrigins, "http://localhost:5173", null);
    }

    public SecurityConfig() {
        this("http://localhost:5173");
    }

    @Bean
    @ConditionalOnMissingBean(ClientRegistrationRepository.class)
    public ClientRegistrationRepository fallbackClientRegistrationRepository(
            @Value("${spring.security.oauth2.client.registration.google.client-id:${GOOGLE_CLIENT_ID:${SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID:mock-google-client-id}}}") String clientId,
            @Value("${spring.security.oauth2.client.registration.google.client-secret:${GOOGLE_CLIENT_SECRET:${SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET:mock-google-client-secret}}}") String clientSecret,
            @Value("${spring.security.oauth2.client.registration.google.redirect-uri:{baseUrl}/login/oauth2/code/{registrationId}}") String redirectUri) {

        String effectiveClientId = (clientId != null && !clientId.trim().isEmpty()) ? clientId.trim() : "mock-google-client-id";
        String effectiveClientSecret = (clientSecret != null && !clientSecret.trim().isEmpty()) ? clientSecret.trim() : "mock-google-client-secret";

        ClientRegistration googleRegistration = CommonOAuth2Provider.GOOGLE.getBuilder("google")
                .clientId(effectiveClientId)
                .clientSecret(effectiveClientSecret)
                .redirectUri(redirectUri)
                .scope("openid", "email", "profile")
                .build();

        return new InMemoryClientRegistrationRepository(googleRegistration);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            @Autowired(required = false) ClientRegistrationRepository clientRegistrations) throws Exception {

        ClientRegistrationRepository effectiveRepo = clientRegistrations;

        http
                .cors(cors -> {})
                // CSRF Protection using standard SPA cookie-to-header pattern
                // Sets XSRF-TOKEN cookie; client sends X-XSRF-TOKEN header on mutating requests
                // /api/users/demo is exempt to allow initial anonymous demo session establishment
                .csrf(csrf -> csrf
                        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        .csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler())
                        .ignoringRequestMatchers(
                                "/api/users/demo",
                                "/ws/**"
                        )
                )
                // Return 401 Unauthorized for unauthenticated API requests rather than 302 redirecting to login page
                .exceptionHandling(ex -> ex
                        .defaultAuthenticationEntryPointFor(
                                new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                                new OrRequestMatcher(
                                        new AntPathRequestMatcher("/api/**"),
                                        new AntPathRequestMatcher("/orders/**")
                                )
                        )
                )
                .authorizeHttpRequests(auth -> auth
                        // Public read-only market data and auth probes
                        .requestMatchers(HttpMethod.GET, "/api/stocks/**", "/orders/book/**", "/api/auth/me").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/users/demo").permitAll()
                        .requestMatchers("/ws/**", "/oauth2/**", "/login/oauth2/**").permitAll()

                        // Protected state-changing and user-owned endpoints
                        .requestMatchers(HttpMethod.POST, "/orders").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/orders/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/orders/user/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/users/*/portfolio").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/users/*").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/auth/logout").authenticated()

                        .anyRequest().permitAll()
                )
                // Ensure XSRF-TOKEN cookie is written on every request
                .addFilterAfter(new CsrfCookieFilter(), BasicAuthenticationFilter.class);

        if (effectiveRepo != null) {
            http.oauth2Login(oauth2 -> {
                oauth2.clientRegistrationRepository(effectiveRepo);
                if (customOidcUserService != null) {
                    oauth2.userInfoEndpoint(userInfo -> userInfo.oidcUserService(customOidcUserService));
                }
                oauth2.successHandler((request, response, authentication) -> {
                    response.sendRedirect(frontendUrl + "/?auth=success");
                });
                oauth2.failureHandler((request, response, exception) -> {
                    String errorMsg = exception != null && exception.getMessage() != null
                            ? exception.getMessage()
                            : "oauth_failure";
                    response.sendRedirect(frontendUrl + "/?auth=error&message=" + URLEncoder.encode(errorMsg, StandardCharsets.UTF_8));
                });
            });
        }

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(parseAllowedOrigins(allowedOrigins));
        configuration.setAllowedMethods(List.of("GET", "POST", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Content-Type", "Authorization", "X-XSRF-TOKEN", "X-Requested-With", "Accept"));
        configuration.setExposedHeaders(List.of("Set-Cookie", "X-XSRF-TOKEN"));
        configuration.setAllowCredentials(true); // Required for authenticated session cookies

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
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

    private static class CsrfCookieFilter extends OncePerRequestFilter {
        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
                throws ServletException, IOException {
            CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
            if (csrfToken != null) {
                // Invoking getToken() forces evaluation of the deferred token and writes the XSRF-TOKEN cookie
                csrfToken.getToken();
            }
            filterChain.doFilter(request, response);
        }
    }
}