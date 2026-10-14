package com.shadowexchange;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shadowexchange.entity.AuthProvider;
import com.shadowexchange.entity.Holding;
import com.shadowexchange.entity.Order;
import com.shadowexchange.entity.OrderStatus;
import com.shadowexchange.entity.OrderType;
import com.shadowexchange.entity.Stock;
import com.shadowexchange.entity.User;
import com.shadowexchange.repository.HoldingRepository;
import com.shadowexchange.repository.OrderRepository;
import com.shadowexchange.repository.StockRepository;
import com.shadowexchange.repository.TradeRepository;
import com.shadowexchange.repository.UserRepository;
import com.shadowexchange.security.CustomOidcUser;
import com.shadowexchange.security.DemoAuthenticationToken;
import com.shadowexchange.security.DemoUserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class SessionIdentityAndTradingAuthorizationTest {

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

    @Autowired
    private TradeRepository tradeRepository;

    private User userA;
    private User userB;
    private Stock stock;

    @BeforeEach
    void setUp() {
        tradeRepository.deleteAll();
        holdingRepository.deleteAll();
        orderRepository.deleteAll();
        stockRepository.deleteAll();
        userRepository.deleteAll();

        userA = new User();
        userA.setUsername("Alice Operator");
        userA.setEmail("alice@example.test");
        userA.setBalance(new BigDecimal("10000.00"));
        userA.setReservedBalance(BigDecimal.ZERO);
        userA.setAuthProvider(AuthProvider.GOOGLE);
        userA.setProviderSubjectId("google-sub-alice");
        userA.setAvatarUrl("https://lh3.googleusercontent.com/alice");
        userA.setIsDemo(false);
        userA = userRepository.save(userA);

        userB = new User();
        userB.setUsername("Bob Demo Operator");
        userB.setEmail("bob@example.test");
        userB.setBalance(new BigDecimal("5000.00"));
        userB.setReservedBalance(BigDecimal.ZERO);
        userB.setAuthProvider(AuthProvider.LOCAL_DEMO);
        userB.setIsDemo(true);
        userB = userRepository.save(userB);

        stock = stockRepository.save(new Stock("SHAD", "Shadow Tech", new BigDecimal("150.00")));
    }

    private static RequestPostProcessor asOidcUser(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("sub", user.getProviderSubjectId() != null ? user.getProviderSubjectId() : "sub-" + user.getId());
        claims.put("email", user.getEmail());
        claims.put("name", user.getUsername());
        claims.put("picture", user.getAvatarUrl());

        OidcIdToken idToken = new OidcIdToken("mock-token", Instant.now(), Instant.now().plusSeconds(3600), claims);
        OidcUserInfo userInfo = new OidcUserInfo(claims);
        OidcUser delegate = new DefaultOidcUser(
                List.of(new SimpleGrantedAuthority("ROLE_USER")),
                idToken,
                userInfo
        );
        CustomOidcUser customOidcUser = new CustomOidcUser(user.getId(), delegate);

        return authentication(new UsernamePasswordAuthenticationToken(
                customOidcUser,
                "n/a",
                customOidcUser.getAuthorities()
        ));
    }

    private static RequestPostProcessor asDemoUser(User user) {
        DemoUserPrincipal principal = new DemoUserPrincipal(user.getId(), user.getUsername(), user.getEmail());
        return authentication(new DemoAuthenticationToken(principal));
    }

    @Test
    @DisplayName("1. Authenticated /api/auth/me returns user identity and balances")
    void testAuthenticatedAuthMe() throws Exception {
        mockMvc.perform(get("/api/auth/me").with(asOidcUser(userA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.id").value(userA.getId()))
                .andExpect(jsonPath("$.username").value("Alice Operator"))
                .andExpect(jsonPath("$.email").value("alice@example.test"))
                .andExpect(jsonPath("$.avatarUrl").value("https://lh3.googleusercontent.com/alice"))
                .andExpect(jsonPath("$.authProvider").value("GOOGLE"))
                .andExpect(jsonPath("$.isDemo").value(false))
                .andExpect(jsonPath("$.balance").value(10000.00))
                .andExpect(jsonPath("$.reservedBalance").value(0.00));
    }

    @Test
    @DisplayName("2. Anonymous /api/auth/me returns 200 OK with authenticated=false")
    void testAnonymousAuthMe() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(false))
                .andExpect(jsonPath("$.id").doesNotExist())
                .andExpect(jsonPath("$.username").doesNotExist());
    }

    @Test
    @DisplayName("3. Successful logout clears session and invalidates authentication")
    void testSuccessfulLogout() throws Exception {
        MockHttpSession session = new MockHttpSession();

        // 1. Establish demo session
        MvcResult demoResult = mockMvc.perform(post("/api/users/demo").session(session))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode demoUser = objectMapper.readTree(demoResult.getResponse().getContentAsString());
        long demoId = demoUser.get("id").asLong();

        // Verify session is recognized as authenticated
        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.id").value(demoId));

        // 2. Perform logout (with CSRF)
        mockMvc.perform(post("/api/auth/logout").session(session).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logged out successfully"))
                .andExpect(header().exists("Set-Cookie"));

        // 3. Confirm session is invalidated
        assertTrue(session.isInvalid());

        // Probe on fresh session returns unauthenticated
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(false));
    }

    @Test
    @DisplayName("4. User A cannot read User B's private portfolio (403 Forbidden)")
    void testUserCannotReadAnotherUsersPortfolio() throws Exception {
        // User A attempts to inspect User B's portfolio
        mockMvc.perform(get("/api/users/{userId}/portfolio", userB.getId())
                        .with(asOidcUser(userA)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("5. User A cannot place orders using User B's identity or funds (403 Forbidden)")
    void testUserCannotPlaceOrderAsAnotherUser() throws Exception {
        mockMvc.perform(post("/orders")
                        .with(csrf())
                        .with(asOidcUser(userA))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "userId": %d,
                                  "stockId": %d,
                                  "type": "BUY",
                                  "price": 100.00,
                                  "quantity": 1
                                }
                                """.formatted(userB.getId(), stock.getId())))
                .andExpect(status().isForbidden());

        // Confirm User B's balance was not charged
        User persistedB = userRepository.findById(userB.getId()).orElseThrow();
        assertEquals(0, persistedB.getBalance().compareTo(new BigDecimal("5000.00")));
        assertEquals(0, persistedB.getReservedBalance().compareTo(BigDecimal.ZERO));
    }

    @Test
    @DisplayName("6. User A cannot cancel User B's order (403 Forbidden)")
    void testUserCannotCancelAnotherUsersOrder() throws Exception {
        // Create an open order owned by User B
        Order bOrder = new Order(userB, stock, new BigDecimal("140.00"), 5, OrderType.BUY, OrderStatus.PENDING);
        bOrder = orderRepository.save(bOrder);

        // User A attempts to cancel User B's order
        mockMvc.perform(delete("/orders/{orderId}", bOrder.getId())
                        .with(csrf())
                        .with(asOidcUser(userA)))
                .andExpect(status().isForbidden());

        // Confirm order status remains PENDING
        Order persistedOrder = orderRepository.findById(bOrder.getId()).orElseThrow();
        assertEquals(OrderStatus.PENDING, persistedOrder.getStatus());
    }

    @Test
    @DisplayName("7. Anonymous callers cannot select or view another user's account (401 / 403)")
    void testAnonymousAndCrossAccountProtection() throws Exception {
        // Unauthenticated access to user details -> 401 Unauthorized
        mockMvc.perform(get("/api/users/{userId}", userA.getId()))
                .andExpect(status().isUnauthorized());

        // User B trying to view User A's details -> 403 Forbidden
        mockMvc.perform(get("/api/users/{userId}", userA.getId())
                        .with(asDemoUser(userB)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("8. Valid demo trading workflow operates normally with server-issued session")
    void testValidDemoTradingOperatesNormally() throws Exception {
        MockHttpSession demoSession = new MockHttpSession();

        // 1. Establish server-issued demo session
        MvcResult demoResult = mockMvc.perform(post("/api/users/demo").session(demoSession))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode demoData = objectMapper.readTree(demoResult.getResponse().getContentAsString());
        long demoUserId = demoData.get("id").asLong();

        // 2. Demo operator places a valid limit BUY order using their session
        mockMvc.perform(post("/orders")
                        .session(demoSession)
                        .with(csrf())
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "userId": %d,
                                  "stockId": %d,
                                  "type": "BUY",
                                  "price": 100.00,
                                  "quantity": 2
                                }
                                """.formatted(demoUserId, stock.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"));

        // 3. Demo operator can inspect their own order history
        mockMvc.perform(get("/orders/user/{userId}", demoUserId)
                        .session(demoSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        // 4. Demo operator can inspect their own portfolio
        mockMvc.perform(get("/api/users/{userId}/portfolio", demoUserId)
                        .session(demoSession))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("10. CSRF protection is enforced for state-changing authenticated requests")
    void testCsrfProtectionIsEnforced() throws Exception {
        // Placing an order without CSRF token -> 403 Forbidden
        mockMvc.perform(post("/orders")
                        .with(asOidcUser(userA))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "userId": %d,
                                  "stockId": %d,
                                  "type": "BUY",
                                  "price": 100.00,
                                  "quantity": 1
                                }
                                """.formatted(userA.getId(), stock.getId())))
                .andExpect(status().isForbidden());

        // Cancelling an order without CSRF token -> 403 Forbidden
        Order order = orderRepository.save(new Order(userA, stock, new BigDecimal("100.00"), 1, OrderType.BUY, OrderStatus.PENDING));
        mockMvc.perform(delete("/orders/{orderId}", order.getId())
                        .with(asOidcUser(userA)))
                .andExpect(status().isForbidden());

        // Logging out without CSRF token -> 403 Forbidden
        mockMvc.perform(post("/api/auth/logout")
                        .with(asOidcUser(userA)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("11. OAuth2 Google authorization endpoint redirects to Google accounts with correct parameters")
    void testGoogleOAuth2AuthorizationEndpointRedirectsCorrectly() throws Exception {
        MvcResult result = mockMvc.perform(get("/oauth2/authorization/google"))
                .andExpect(status().is3xxRedirection())
                .andReturn();

        String location = result.getResponse().getHeader("Location");
        assertNotNull(location);
        assertTrue(location.startsWith("https://accounts.google.com/o/oauth2/v2/auth"));
        assertTrue(location.contains("response_type=code"));
        assertTrue(location.contains("scope=openid%20email%20profile"));
        assertTrue(location.contains("redirect_uri="));
    }
}
