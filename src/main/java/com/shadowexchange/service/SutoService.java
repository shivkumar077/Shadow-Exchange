package com.shadowexchange.service;

import com.shadowexchange.config.SutoProperties;
import com.shadowexchange.dto.SutoContentResponse;
import com.shadowexchange.entity.AuthProvider;
import com.shadowexchange.entity.User;
import com.shadowexchange.security.SecurityUserHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

/**
 * Service enforcing authorization rules and delivering private content for /suto.
 * Strictly verifies authenticated Google account against configured allowlist.
 */
@Service
public class SutoService {

    private static final Logger log = LoggerFactory.getLogger(SutoService.class);

    private final SutoProperties sutoProperties;
    private final SecurityUserHelper securityUserHelper;

    public SutoService(SutoProperties sutoProperties, SecurityUserHelper securityUserHelper) {
        this.sutoProperties = sutoProperties;
        this.securityUserHelper = securityUserHelper;
    }

    public enum AuthState {
        UNAUTHENTICATED,
        UNAUTHORIZED,
        AUTHORIZED
    }

    public record AuthorizationDecision(AuthState state, String userEmail, String recipientName) {}

    /**
     * Inspects active security context and user record to determine authorization.
     */
    public AuthorizationDecision checkCurrentAuthorization() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return new AuthorizationDecision(AuthState.UNAUTHENTICATED, null, null);
        }

        String email = null;
        boolean emailVerified = false;
        boolean isGoogleProvider = false;

        Object principal = auth.getPrincipal();
        if (principal instanceof OidcUser oidcUser) {
            isGoogleProvider = true;
            email = oidcUser.getEmail();
            emailVerified = Boolean.TRUE.equals(oidcUser.getEmailVerified());
            if (email == null) {
                Object claimEmail = oidcUser.getClaim("email");
                if (claimEmail instanceof String s) {
                    email = s;
                }
            }
            if (!emailVerified) {
                Object claimVerified = oidcUser.getClaim("email_verified");
                if (claimVerified instanceof Boolean b) {
                    emailVerified = b;
                } else if (claimVerified instanceof String s) {
                    emailVerified = "true".equalsIgnoreCase(s);
                }
            }
        } else if (principal instanceof OAuth2User oauth2User) {
            isGoogleProvider = true;
            Object emailAttr = oauth2User.getAttribute("email");
            if (emailAttr instanceof String s) {
                email = s;
            }
            Object verifiedAttr = oauth2User.getAttribute("email_verified");
            if (verifiedAttr instanceof Boolean b) {
                emailVerified = b;
            } else if (verifiedAttr instanceof String s) {
                emailVerified = "true".equalsIgnoreCase(s);
            }
        }

        // Also cross-reference active User entity in database
        Optional<User> userOpt = securityUserHelper.getCurrentUserEntity();
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getAuthProvider() == AuthProvider.GOOGLE) {
                isGoogleProvider = true;
                if (email == null && user.getEmail() != null) {
                    email = user.getEmail();
                }
                if (!emailVerified && Boolean.TRUE.equals(user.getEmailVerified())) {
                    emailVerified = true;
                }
            } else {
                log.warn("Suto access rejected: user account is non-Google (provider: {})", user.getAuthProvider());
                return new AuthorizationDecision(AuthState.UNAUTHORIZED, null, null);
            }
        }

        if (!isGoogleProvider) {
            log.warn("Suto access rejected: session principal is not a Google identity ({})", principal.getClass().getSimpleName());
            return new AuthorizationDecision(AuthState.UNAUTHORIZED, null, null);
        }

        if (!emailVerified) {
            log.warn("Suto access rejected: Google email is not verified");
            return new AuthorizationDecision(AuthState.UNAUTHORIZED, null, null);
        }

        if (email == null || !sutoProperties.isAllowed(email)) {
            log.warn("Suto access rejected: authenticated identity is not on the allowlist");
            return new AuthorizationDecision(AuthState.UNAUTHORIZED, null, null);
        }

        String recipientName = email.toLowerCase().contains("sutanuka") ? "Sutanuka" : "Shiv";
        return new AuthorizationDecision(AuthState.AUTHORIZED, email, recipientName);
    }

    /**
     * Delivers private romantic content to authorized visitors.
     * Throws 401 Unauthorized for unauthenticated callers, 403 Forbidden for unauthorized callers.
     */
    public SutoContentResponse getPrivateContent() {
        AuthorizationDecision decision = checkCurrentAuthorization();
        if (decision.state() == AuthState.UNAUTHENTICATED) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required to access /suto");
        }
        if (decision.state() == AuthState.UNAUTHORIZED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to /suto");
        }

        return new SutoContentResponse(
                true,
                decision.recipientName(),
                "Hey, baby. Welcome to the little world I made for you, where I poured my heart out for you.",
                List.of(
                        new SutoContentResponse.LetterSection(
                                "garden-prologue",
                                "A Sanctuary in the Trees",
                                "This little corner of the world is yours—crafted petal by petal, line by line. Away from market tickers and endless noise, every blossom and gentle breeze here was made with you in mind."
                        ),
                        new SutoContentResponse.LetterSection(
                                "quiet-heart",
                                "Where My Heart Rests",
                                "No matter where the day goes or how chaotic everything outside becomes, coming here reminds me of what is pure, gentle, and lasting. You are the quiet peace I always look forward to."
                        ),
                        new SutoContentResponse.LetterSection(
                                "eternal-bloom",
                                "Forever in Bloom",
                                "Every petal falling through this garden carries a little whisper of gratitude for your smile, your warmth, and having you in my life. I love you, always."
                        )
                )
        );
    }
}
