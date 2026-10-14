package com.shadowexchange.security;

import com.shadowexchange.entity.AuthProvider;
import com.shadowexchange.entity.User;
import com.shadowexchange.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
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
     * Supports CustomOidcUser, DemoUserPrincipal, raw numeric IDs, and generic OidcUser/OAuth2User fallbacks.
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
        if (principal instanceof OidcUser oidcUser) {
            String sub = oidcUser.getSubject();
            if (sub != null && !sub.isBlank()) {
                Optional<User> user = userRepository.findByAuthProviderAndProviderSubjectId(AuthProvider.GOOGLE, sub);
                if (user.isPresent()) {
                    return user.map(User::getId);
                }
            }
            String email = oidcUser.getEmail();
            if (email != null && !email.isBlank()) {
                Optional<User> user = userRepository.findByEmail(email);
                if (user.isPresent()) {
                    return user.map(User::getId);
                }
            }
        }
        if (principal instanceof OAuth2User oauth2User) {
            String sub = oauth2User.getAttribute("sub");
            if (sub != null && !sub.isBlank()) {
                Optional<User> user = userRepository.findByAuthProviderAndProviderSubjectId(AuthProvider.GOOGLE, sub);
                if (user.isPresent()) {
                    return user.map(User::getId);
                }
            }
            String email = oauth2User.getAttribute("email");
            if (email != null && !email.isBlank()) {
                Optional<User> user = userRepository.findByEmail(email);
                if (user.isPresent()) {
                    return user.map(User::getId);
                }
            }
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
