package com.shadowexchange;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shadowexchange.entity.AuthProvider;
import com.shadowexchange.entity.User;
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
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SutoAuthorizationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private com.shadowexchange.repository.TradeRepository tradeRepository;

    @Autowired
    private com.shadowexchange.repository.OrderRepository orderRepository;

    @Autowired
    private com.shadowexchange.repository.HoldingRepository holdingRepository;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        tradeRepository.deleteAll();
        orderRepository.deleteAll();
        holdingRepository.deleteAll();
        userRepository.deleteAll();
    }

    private OAuth2AuthenticationToken createGoogleAuthToken(User user, String email, boolean emailVerified) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("sub", user.getProviderSubjectId());
        claims.put("email", email);
        claims.put("email_verified", emailVerified);
        claims.put("name", user.getUsername());
        claims.put("picture", user.getAvatarUrl());

        OidcIdToken idToken = new OidcIdToken("dummy-token-val", Instant.now(), Instant.now().plusSeconds(3600), claims);
        OidcUserInfo userInfo = new OidcUserInfo(claims);
        DefaultOidcUser delegate = new DefaultOidcUser(
                Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")),
                idToken,
                userInfo,
                "email"
        );

        CustomOidcUser customOidcUser = new CustomOidcUser(user.getId(), delegate);

        return new OAuth2AuthenticationToken(
                customOidcUser,
                Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")),
                "google"
        );
    }

    @Test
    @DisplayName("Allowlisted account 'shivkumar6990655@gmail.com' can access private /suto content")
    void testAllowlistedAccountShivAccessGranted() throws Exception {
        User user = new User();
        user.setUsername("Shiv Kumar");
        user.setEmail("shivkumar6990655@gmail.com");
        user.setEmailVerified(true);
        user.setAuthProvider(AuthProvider.GOOGLE);
        user.setProviderSubjectId("google-sub-shiv-1");
        user.setBalance(new BigDecimal("10000.00"));
        user.setReservedBalance(BigDecimal.ZERO);
        user.setIsDemo(false);
        user = userRepository.save(user);

        OAuth2AuthenticationToken auth = createGoogleAuthToken(user, "shivkumar6990655@gmail.com", true);

        MvcResult result = mockMvc.perform(get("/api/suto/content").with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authorized").value(true))
                .andExpect(jsonPath("$.welcomeMessage").value("Hey, baby. Welcome to the little world I made for you, where I poured my heart out for you."))
                .andExpect(jsonPath("$.letterSections").isArray())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        assertTrue(json.get("letterSections").size() >= 2, "Must contain romantic letter sections");
    }

    @Test
    @DisplayName("Allowlisted account 'sutanukachakraborty004@gmail.com' with mixed casing is authorized")
    void testAllowlistedAccountSutanukaMixedCaseAccessGranted() throws Exception {
        User user = new User();
        user.setUsername("Sutanuka Chakraborty");
        user.setEmail("sutanukachakraborty004@gmail.com");
        user.setEmailVerified(true);
        user.setAuthProvider(AuthProvider.GOOGLE);
        user.setProviderSubjectId("google-sub-suto-2");
        user.setBalance(new BigDecimal("10000.00"));
        user.setReservedBalance(BigDecimal.ZERO);
        user.setIsDemo(false);
        user = userRepository.save(user);

        // Mixed case email token
        OAuth2AuthenticationToken auth = createGoogleAuthToken(user, "SutanukaChakraborty004@GMAIL.COM", true);

        mockMvc.perform(get("/api/suto/content").with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authorized").value(true))
                .andExpect(jsonPath("$.recipientName").value("Sutanuka"))
                .andExpect(jsonPath("$.welcomeMessage").value("Hey, baby. Welcome to the little world I made for you, where I poured my heart out for you."));
    }

    @Test
    @DisplayName("Authenticated Google user NOT on the allowlist receives 403 Forbidden with zero private content")
    void testUnauthorizedGoogleAccountBlocked() throws Exception {
        User user = new User();
        user.setUsername("Random Person");
        user.setEmail("stranger.intruder@gmail.com");
        user.setEmailVerified(true);
        user.setAuthProvider(AuthProvider.GOOGLE);
        user.setProviderSubjectId("google-sub-stranger-999");
        user.setBalance(new BigDecimal("10000.00"));
        user.setReservedBalance(BigDecimal.ZERO);
        user.setIsDemo(false);
        user = userRepository.save(user);

        OAuth2AuthenticationToken auth = createGoogleAuthToken(user, "stranger.intruder@gmail.com", true);

        MvcResult result = mockMvc.perform(get("/api/suto/content").with(authentication(auth)))
                .andExpect(status().isForbidden())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertFalse(body.contains("Hey, baby"), "Unauthorized response must never contain romantic welcome message");
        assertFalse(body.contains("shivkumar6990655"), "Must not leak allowed email list");
        assertFalse(body.contains("sutanukachakraborty004"), "Must not leak allowed email list");
    }

    @Test
    @DisplayName("Google account with unverified email receives 403 Forbidden")
    void testUnverifiedEmailBlocked() throws Exception {
        User user = new User();
        user.setUsername("Shiv Fake");
        user.setEmail("shivkumar6990655@gmail.com");
        user.setEmailVerified(false);
        user.setAuthProvider(AuthProvider.GOOGLE);
        user.setProviderSubjectId("google-sub-unverified-111");
        user.setBalance(new BigDecimal("10000.00"));
        user.setReservedBalance(BigDecimal.ZERO);
        user.setIsDemo(false);
        user = userRepository.save(user);

        OAuth2AuthenticationToken auth = createGoogleAuthToken(user, "shivkumar6990655@gmail.com", false);

        MvcResult result = mockMvc.perform(get("/api/suto/content").with(authentication(auth)))
                .andExpect(status().isForbidden())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertFalse(body.contains("Hey, baby"), "Unverified email must not receive romantic content");
    }

    @Test
    @DisplayName("Unauthenticated anonymous visitor receives 401 Unauthorized")
    void testUnauthenticatedAccessBlocked() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/suto/content"))
                .andExpect(status().isUnauthorized())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertFalse(body.contains("Hey, baby"), "Unauthenticated request must never receive private content");
    }

    @Test
    @DisplayName("Non-Google authenticated user (e.g. demo account) receives 403 Forbidden")
    void testNonGoogleAccountBlocked() throws Exception {
        User demoUser = new User();
        demoUser.setUsername("Demo Trader");
        demoUser.setEmail("shivkumar6990655@gmail.com"); // even if demo user tries to impersonate email
        demoUser.setAuthProvider(AuthProvider.LOCAL_DEMO);
        demoUser.setIsDemo(true);
        demoUser.setBalance(new BigDecimal("10000.00"));
        demoUser.setReservedBalance(BigDecimal.ZERO);
        demoUser = userRepository.save(demoUser);

        DemoUserPrincipal principal = new DemoUserPrincipal(demoUser.getId(), demoUser.getUsername(), demoUser.getEmail());
        DemoAuthenticationToken auth = new DemoAuthenticationToken(principal);

        mockMvc.perform(get("/api/suto/content").with(authentication(auth)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Status probe /api/suto/status returns accurate flags without leaking secrets")
    void testStatusProbeBehavior() throws Exception {
        // Anonymous probe
        mockMvc.perform(get("/api/suto/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(false))
                .andExpect(jsonPath("$.authorized").value(false));

        // Authorized probe
        User user = new User();
        user.setUsername("Sutanuka Chakraborty");
        user.setEmail("sutanukachakraborty004@gmail.com");
        user.setEmailVerified(true);
        user.setAuthProvider(AuthProvider.GOOGLE);
        user.setProviderSubjectId("google-sub-status-test");
        user.setBalance(new BigDecimal("10000.00"));
        user.setReservedBalance(BigDecimal.ZERO);
        user.setIsDemo(false);
        user = userRepository.save(user);

        OAuth2AuthenticationToken auth = createGoogleAuthToken(user, "sutanukachakraborty004@gmail.com", true);

        mockMvc.perform(get("/api/suto/status").with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.authorized").value(true))
                .andExpect(jsonPath("$.recipientName").value("Sutanuka"));
    }
}
