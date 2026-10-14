package com.shadowexchange.security;

import org.springframework.security.authentication.AbstractAuthenticationToken;

/**
 * Authentication token for a verified demo session operator.
 */
public class DemoAuthenticationToken extends AbstractAuthenticationToken {

    private final DemoUserPrincipal principal;

    public DemoAuthenticationToken(DemoUserPrincipal principal) {
        super(principal.getAuthorities());
        this.principal = principal;
        setAuthenticated(true);
    }

    @Override
    public Object getCredentials() {
        return null;
    }

    @Override
    public Object getPrincipal() {
        return principal;
    }
}
