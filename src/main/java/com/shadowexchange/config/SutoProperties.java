package com.shadowexchange.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Collections;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Encapsulates the allowlist configuration for the private romantic /suto experience.
 * Case-insensitive comparison against verified Google email addresses.
 */
@Component
public class SutoProperties {

    private final Set<String> allowedEmails;

    public SutoProperties(
            @Value("${suto.allowed-emails:${SUTO_ALLOWED_EMAILS:shivkumar6990655@gmail.com,sutanukachakraborty004@gmail.com}}") String allowedEmailsConfig) {
        if (allowedEmailsConfig == null || allowedEmailsConfig.isBlank()) {
            this.allowedEmails = Collections.emptySet();
        } else {
            this.allowedEmails = Arrays.stream(allowedEmailsConfig.split(","))
                    .map(String::trim)
                    .map(s -> s.toLowerCase(Locale.ROOT))
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toUnmodifiableSet());
        }
    }

    public boolean isAllowed(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        return allowedEmails.contains(email.trim().toLowerCase(Locale.ROOT));
    }

    public Set<String> getAllowedEmails() {
        return allowedEmails;
    }
}
