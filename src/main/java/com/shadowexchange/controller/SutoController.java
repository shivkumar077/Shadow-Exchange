package com.shadowexchange.controller;

import com.shadowexchange.dto.SutoContentResponse;
import com.shadowexchange.dto.SutoStatusResponse;
import com.shadowexchange.service.SutoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller exposing protected /suto content and session status.
 * Server-side authorization ensures unauthorized or unverified users never receive private content.
 */
@RestController
@RequestMapping("/api/suto")
public class SutoController {

    private final SutoService sutoService;

    public SutoController(SutoService sutoService) {
        this.sutoService = sutoService;
    }

    /**
     * Non-leaking session status probe for /suto.
     */
    @GetMapping("/status")
    public SutoStatusResponse getStatus() {
        SutoService.AuthorizationDecision decision = sutoService.checkCurrentAuthorization();
        return switch (decision.state()) {
            case UNAUTHENTICATED -> SutoStatusResponse.unauthenticated();
            case UNAUTHORIZED -> SutoStatusResponse.unauthorized();
            case AUTHORIZED -> SutoStatusResponse.authorized(decision.recipientName());
        };
    }

    /**
     * Protected romantic content endpoint.
     * Returns 401 if unauthenticated, 403 if unauthorized, and private content only if authorized.
     */
    @GetMapping("/content")
    public ResponseEntity<SutoContentResponse> getContent() {
        return ResponseEntity.ok(sutoService.getPrivateContent());
    }
}
