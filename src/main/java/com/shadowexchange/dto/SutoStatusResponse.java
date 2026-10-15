package com.shadowexchange.dto;

/**
 * Status probe response for /suto.
 * Never leaks the allowlist or internal entity details to unauthorized callers.
 */
public record SutoStatusResponse(
        boolean authenticated,
        boolean authorized,
        String recipientName
) {
    public static SutoStatusResponse unauthenticated() {
        return new SutoStatusResponse(false, false, null);
    }

    public static SutoStatusResponse unauthorized() {
        return new SutoStatusResponse(true, false, null);
    }

    public static SutoStatusResponse authorized(String recipientName) {
        return new SutoStatusResponse(true, true, recipientName);
    }
}
