package com.shadowexchange.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import java.io.Serializable;
import java.util.Collection;
import java.util.Map;

/**
 * Custom OidcUser decorator that wraps the Spring Security OidcUser and binds
 * the local Shadow Exchange database userId to the authenticated security principal.
 */
public class CustomOidcUser implements OidcUser, Serializable {

    private static final long serialVersionUID = 1L;

    private final Long userId;
    private final OidcUser delegate;

    public CustomOidcUser(Long userId, OidcUser delegate) {
        this.userId = userId;
        this.delegate = delegate;
    }

    public Long getUserId() {
        return userId;
    }

    @Override
    public Map<String, Object> getClaims() {
        return delegate.getClaims();
    }

    @Override
    public OidcUserInfo getUserInfo() {
        return delegate.getUserInfo();
    }

    @Override
    public OidcIdToken getIdToken() {
        return delegate.getIdToken();
    }

    @Override
    public Map<String, Object> getAttributes() {
        return delegate.getAttributes();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return delegate.getAuthorities();
    }

    @Override
    public String getName() {
        return delegate.getName();
    }
}
