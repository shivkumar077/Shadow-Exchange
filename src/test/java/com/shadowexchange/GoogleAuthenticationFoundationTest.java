package com.shadowexchange;

import com.shadowexchange.dto.UserResponse;
import com.shadowexchange.entity.AuthProvider;
import com.shadowexchange.entity.Holding;
import com.shadowexchange.entity.User;
import com.shadowexchange.repository.HoldingRepository;
import com.shadowexchange.repository.OrderRepository;
import com.shadowexchange.repository.TradeRepository;
import com.shadowexchange.repository.UserRepository;
import com.shadowexchange.security.CustomOidcUser;
import com.shadowexchange.service.GoogleAccountProvisioningService;
import com.shadowexchange.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class GoogleAuthenticationFoundationTest {

    @Autowired
    private GoogleAccountProvisioningService provisioningService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HoldingRepository holdingRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private TradeRepository tradeRepository;

    @Autowired
    private UserService userService;

    @BeforeEach
    void setUp() {
        tradeRepository.deleteAll();
        orderRepository.deleteAll();
        holdingRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Creating a new Google-linked user provisions exact $10,000 cash and no stock holdings")
    void testCreateNewGoogleUserWithCorrectBalanceAndNoHoldings() {
        String sub = "google-sub-10001";
        String email = "trader.operator@gmail.com";
        String name = "Alex Mercer";
        String picture = "https://lh3.googleusercontent.com/a/mock-pic-1";

        User user = provisioningService.provisionOrUpdateGoogleUser(
                sub,
                email,
                true,
                name,
                picture
        );

        assertNotNull(user);
        assertNotNull(user.getId());
        assertEquals("Alex Mercer", user.getUsername());
        assertEquals("trader.operator@gmail.com", user.getEmail());
        assertNull(user.getPassword(), "Google-authenticated users should not have a local password");
        assertEquals(new BigDecimal("10000.00"), user.getBalance(), "New Google users receive exactly $10,000.00 virtual cash");
        assertEquals(BigDecimal.ZERO, user.getReservedBalance());
        assertEquals(AuthProvider.GOOGLE, user.getAuthProvider());
        assertEquals(sub, user.getProviderSubjectId());
        assertEquals(picture, user.getAvatarUrl());
        assertFalse(user.getIsDemo(), "Google-authenticated user must not be flagged as demo");

        // Verify no preloaded stock holdings were added to new Google account
        List<Holding> holdings = holdingRepository.findAll();
        boolean hasHoldingsForUser = holdings.stream().anyMatch(h -> h.getUser().getId().equals(user.getId()));
        assertFalse(hasHoldingsForUser, "New Google users must have clean, empty holdings");
    }

    @Test
    @DisplayName("Finding an existing user by Google provider subject returns existing record without duplicating")
    void testFindExistingUserByProviderSubject() {
        String sub = "google-sub-20002";
        User firstLogin = provisioningService.provisionOrUpdateGoogleUser(
                sub,
                "first.login@gmail.com",
                true,
                "First Operator",
                "https://lh3.googleusercontent.com/pic-2"
        );

        long initialUserCount = userRepository.count();

        // Second login with identical provider subject
        User secondLogin = provisioningService.provisionOrUpdateGoogleUser(
                sub,
                "first.login@gmail.com",
                true,
                "First Operator",
                "https://lh3.googleusercontent.com/pic-2"
        );

        assertEquals(firstLogin.getId(), secondLogin.getId(), "Must return the exact same user ID");
        assertEquals(initialUserCount, userRepository.count(), "User count in database must not increase on repeated login");
    }

    @Test
    @DisplayName("Returning user login preserves balances and trading history when profile changes")
    void testReturningUserPreservesBalanceAcrossLogins() {
        String sub = "google-sub-30003";
        User user = provisioningService.provisionOrUpdateGoogleUser(
                sub,
                "portfolio.trader@gmail.com",
                true,
                "Old Display Name",
                "https://lh3.googleusercontent.com/old-avatar"
        );

        // Simulate trading activity that altered the user's cash balance
        user.setBalance(new BigDecimal("18450.75"));
        user.setReservedBalance(new BigDecimal("1200.00"));
        userRepository.save(user);

        // User logs in again, with updated Google profile name and photo
        User returningUser = provisioningService.provisionOrUpdateGoogleUser(
                sub,
                "portfolio.trader@gmail.com",
                true,
                "New Modern Name",
                "https://lh3.googleusercontent.com/new-avatar"
        );

        assertEquals(user.getId(), returningUser.getId());
        assertEquals(new BigDecimal("18450.75"), returningUser.getBalance(), "Balance must be preserved, not overwritten");
        assertEquals(new BigDecimal("1200.00"), returningUser.getReservedBalance(), "Reserved balance must be preserved");
        assertEquals("New Modern Name", returningUser.getUsername(), "Display name should be updated");
        assertEquals("https://lh3.googleusercontent.com/new-avatar", returningUser.getAvatarUrl(), "Avatar URL should be updated");
    }

    @Test
    @DisplayName("Handling conflicting existing email safely without silent account linking")
    void testConflictingEmailThrowsAccountConflictException() {
        // Create an existing local demo user with a specific email
        User existingUser = new User();
        existingUser.setUsername("Existing Trader");
        existingUser.setEmail("conflict.target@example.com");
        existingUser.setPassword("demo-pass");
        existingUser.setBalance(new BigDecimal("5000.00"));
        existingUser.setReservedBalance(BigDecimal.ZERO);
        existingUser.setAuthProvider(AuthProvider.LOCAL_DEMO);
        existingUser.setIsDemo(true);
        userRepository.save(existingUser);

        // Attempt to log in with a new Google account that claims the same email
        OAuth2AuthenticationException exception = assertThrows(
                OAuth2AuthenticationException.class,
                () -> provisioningService.provisionOrUpdateGoogleUser(
                        "google-sub-new-unlinked",
                        "conflict.target@example.com",
                        true,
                        "Intruder Or Conflicting Operator",
                        null
                )
        );

        assertEquals("account_conflict", exception.getError().getErrorCode());
        assertTrue(exception.getMessage().contains("Silent account linking is disabled for security"));

        // Verify the existing user was NOT modified or hijacked
        User unchangedUser = userRepository.findById(existingUser.getId()).orElseThrow();
        assertEquals(AuthProvider.LOCAL_DEMO, unchangedUser.getAuthProvider());
        assertNull(unchangedUser.getProviderSubjectId());
    }

    @Test
    @DisplayName("Preserving existing demo user creation behavior and randomized starter positions")
    void testPreserveExistingDemoUserCreationBehavior() {
        UserResponse demoUser = userService.createDemoUser();

        assertNotNull(demoUser);
        assertNotNull(demoUser.getId());
        assertEquals(AuthProvider.LOCAL_DEMO, demoUser.getAuthProvider());
        assertTrue(demoUser.getIsDemo());

        User entity = userRepository.findById(demoUser.getId()).orElseThrow();
        assertEquals(AuthProvider.LOCAL_DEMO, entity.getAuthProvider());
        assertTrue(entity.getIsDemo());
        assertNull(entity.getProviderSubjectId());

        // Verify demo cash is within configured bounds ($3,000 to $35,000)
        assertTrue(entity.getBalance().compareTo(UserService.MIN_DEMO_CASH) >= 0);
        assertTrue(entity.getBalance().compareTo(UserService.MAX_DEMO_CASH) <= 0);

        // Verify lookup by provider subject returns empty for demo accounts
        Optional<User> lookup = userRepository.findByAuthProviderAndProviderSubjectId(AuthProvider.GOOGLE, "any-subject");
        assertTrue(lookup.isEmpty());
    }

    @Test
    @DisplayName("CustomOidcUser correctly wraps delegate and exposes internal database userId")
    void testCustomOidcUserPrincipalWrapper() {
        Map<String, Object> claims = new HashMap<>();
        claims.put("sub", "google-sub-40004");
        claims.put("email", "wrapper.test@gmail.com");
        claims.put("name", "Wrapper Operator");

        OidcIdToken idToken = new OidcIdToken("mock-token-value", Instant.now(), Instant.now().plusSeconds(3600), claims);
        OidcUserInfo userInfo = new OidcUserInfo(claims);
        OidcUser delegate = new DefaultOidcUser(Collections.emptyList(), idToken, userInfo);

        Long expectedUserId = 9988L;
        CustomOidcUser customOidcUser = new CustomOidcUser(expectedUserId, delegate);

        assertEquals(expectedUserId, customOidcUser.getUserId());
        assertEquals("google-sub-40004", customOidcUser.getSubject());
        assertEquals("wrapper.test@gmail.com", customOidcUser.getEmail());
        assertEquals(idToken, customOidcUser.getIdToken());
        assertEquals(userInfo, customOidcUser.getUserInfo());
        assertEquals("Wrapper Operator", customOidcUser.getAttribute("name"));
    }
}
