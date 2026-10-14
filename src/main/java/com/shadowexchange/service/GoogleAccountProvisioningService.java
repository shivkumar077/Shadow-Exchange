package com.shadowexchange.service;

import com.shadowexchange.entity.AuthProvider;
import com.shadowexchange.entity.User;
import com.shadowexchange.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
public class GoogleAccountProvisioningService {

    private static final Logger log = LoggerFactory.getLogger(GoogleAccountProvisioningService.class);
    public static final BigDecimal STARTING_GOOGLE_BALANCE = new BigDecimal("10000.00");

    private final UserRepository userRepository;

    public GoogleAccountProvisioningService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Finds an existing Google-linked user by verified OIDC 'sub' identifier, or provisions
     * a new user with $10,000 virtual cash and no starter positions.
     *
     * @param sub           The verified immutable Google Subject Identifier.
     * @param email         The email claim from Google.
     * @param emailVerified Whether Google verified this email address.
     * @param name          The user's display name.
     * @param pictureUrl    The user's profile avatar URL.
     * @return The existing or newly created User entity.
     * @throws OAuth2AuthenticationException if an account conflict is detected.
     */
    @Transactional
    public User provisionOrUpdateGoogleUser(
            String sub,
            String email,
            Boolean emailVerified,
            String name,
            String pictureUrl) {

        if (sub == null || sub.isBlank()) {
            throw new OAuth2AuthenticationException(
                    new OAuth2Error("invalid_token"),
                    "Google subject identifier (sub) is missing."
            );
        }

        // 1. Identity Key Lookup: Query by AuthProvider.GOOGLE and providerSubjectId
        Optional<User> existingUserOpt = userRepository.findByAuthProviderAndProviderSubjectId(AuthProvider.GOOGLE, sub);

        if (existingUserOpt.isPresent()) {
            User user = existingUserOpt.get();
            log.info("Found returning Google user: id={}, sub={}", user.getId(), sub);

            // Update mutable profile info if changed, but NEVER alter balances or holdings!
            boolean updated = false;
            if (pictureUrl != null && !pictureUrl.equals(user.getAvatarUrl())) {
                user.setAvatarUrl(pictureUrl);
                updated = true;
            }
            if (name != null && !name.isBlank() && !name.equals(user.getUsername())) {
                user.setUsername(name);
                updated = true;
            }
            // Update email only if verified by Google and different
            if (Boolean.TRUE.equals(emailVerified) && email != null && !email.isBlank() && !email.equalsIgnoreCase(user.getEmail())) {
                user.setEmail(email);
                updated = true;
            }
            if (updated) {
                user = userRepository.save(user);
            }
            return user;
        }

        // 2. Safe Account Conflict Handling:
        // Before creating a brand new account, check if an existing user already uses this email.
        if (email != null && !email.isBlank()) {
            Optional<User> conflictingUserOpt = userRepository.findByEmail(email);
            if (conflictingUserOpt.isPresent()) {
                User conflictingUser = conflictingUserOpt.get();
                // Never silently link a Google identity to an existing account based only on matching email.
                log.warn("Conflicting email detected during Google authentication: email={}, existingUserId={}, existingProvider={}",
                        email, conflictingUser.getId(), conflictingUser.getAuthProvider());
                throw new OAuth2AuthenticationException(
                        new OAuth2Error("account_conflict"),
                        "An account with email '" + email + "' already exists. Silent account linking is disabled for security."
                );
            }
        }

        // 3. New User Provisioning:
        // Real Google-authenticated account starts with $10,000 virtual cash and zero preloaded stock holdings.
        log.info("Provisioning new Google user: sub={}, email={}", sub, email);
        User newUser = new User();
        String displayName = (name != null && !name.isBlank()) ? name : (email != null ? email : "Google Operator");
        newUser.setUsername(displayName);
        newUser.setEmail(Boolean.TRUE.equals(emailVerified) ? email : null);
        newUser.setPassword(null); // No local password for Google OIDC users
        newUser.setBalance(STARTING_GOOGLE_BALANCE);
        newUser.setReservedBalance(BigDecimal.ZERO);
        newUser.setAuthProvider(AuthProvider.GOOGLE);
        newUser.setProviderSubjectId(sub);
        newUser.setAvatarUrl(pictureUrl);
        newUser.setIsDemo(false);

        return userRepository.save(newUser);
    }
}
