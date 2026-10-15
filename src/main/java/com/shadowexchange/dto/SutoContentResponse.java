package com.shadowexchange.dto;

import java.util.List;

/**
 * Payload delivered to authorized users accessing /suto.
 * Contains the welcome moment and extensible letter sections.
 */
public record SutoContentResponse(
        boolean authorized,
        String recipientName,
        String welcomeMessage,
        List<LetterSection> letterSections
) {
    public record LetterSection(
            String id,
            String title,
            String content
    ) {}
}
