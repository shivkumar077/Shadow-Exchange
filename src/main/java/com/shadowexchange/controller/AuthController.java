package com.shadowexchange.controller;

import com.shadowexchange.dto.AuthStatusResponse;
import com.shadowexchange.entity.User;
import com.shadowexchange.security.SecurityUserHelper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;

/**
 * Controller exposing session identity probes and server-side logout.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final SecurityUserHelper securityUserHelper;

    public AuthController(SecurityUserHelper securityUserHelper) {
        this.securityUserHelper = securityUserHelper;
    }

    /**
     * Returns the currently active session user, or an unauthenticated status response.
     * Never leaks tokens, secrets, or internal entity hashes.
     */
    @GetMapping("/me")
    public AuthStatusResponse getCurrentUser() {
        Optional<User> userOpt = securityUserHelper.getCurrentUserEntity();
        return userOpt.map(AuthStatusResponse::authenticated)
                .orElseGet(AuthStatusResponse::unauthenticated);
    }

    /**
     * Server-side logout endpoint.
     * Invalidates the server-side session, clears the SecurityContext, and clears the session cookie.
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) {

        if (authentication != null) {
            new SecurityContextLogoutHandler().logout(request, response, authentication);
        }

        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        SecurityContextHolder.clearContext();

        // Instruct browser to clear JSESSIONID cookie
        ResponseCookie clearCookie = ResponseCookie.from("JSESSIONID", "")
                .path("/")
                .maxAge(0)
                .httpOnly(true)
                .sameSite("Lax")
                .secure(request.isSecure() || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto")))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, clearCookie.toString());

        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}
