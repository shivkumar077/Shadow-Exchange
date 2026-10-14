package com.shadowexchange.security;

import com.shadowexchange.entity.User;
import com.shadowexchange.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

/**
 * Helper component that resolves the active user identity from the Spring Security session.
 * Prevents callers from claiming arbitrary numeric IDs.
 */
@Component
public class SecurityUserHelper {

    private final UserRepository userRepository;

    public SecurityUserHelper(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Resolves the internal database userId of the currently authenticated caller.
     * Supports both Google OIDC users (CustomOidcUser) and demo operators (DemoUserPrincipal).
     */
    public Optional<Long> getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return Optional.empty();
        }

        Object principal = auth.getPrincipal();
        if (principal instanceof CustomOidcUser oidcUser) {
            return Optional.ofNullable(oidcUser.getUserId());
        }
        if (principal instanceof DemoUserPrincipal demoPrincipal) {
            return Optional.ofNullable(demoPrincipal.getUserId());
        }
        if (principal instanceof Long id) {
            return Optional.of(id);
        }

        return Optional.empty();
    }

    /**
     * Requires an authenticated session, throwing 401 Unauthorized if missing.
     */
    public Long requireCurrentUserId() {
        return getCurrentUserId().orElseThrow(() ->
                new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required to access this resource")
        );
    }

    /**
     * Retrieves the active database User entity for the current session.
     */
    public Optional<User> getCurrentUserEntity() {
        return getCurrentUserId().flatMap(userRepository::findById);
    }

    /**
     * Requires the active database User entity, throwing 401 Unauthorized if missing.
     */
    public User requireCurrentUserEntity() {
        Long userId = requireCurrentUserId();
        return userRepository.findById(userId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found in database")
        );
    }
}
