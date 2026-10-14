package com.shadowexchange.security;

import com.shadowexchange.entity.AuthProvider;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.io.Serializable;
import java.util.Collection;
import java.util.List;

/**
 * Security principal representing an active demo session operator.
 * Binds the server-issued session to the specific demo user record in the database.
 */
public class DemoUserPrincipal implements Serializable {

    private final Long userId;
    private final String username;
    private final String email;

    public DemoUserPrincipal(Long userId, String username, String email) {
        this.userId = userId;
        this.username = username;
        this.email = email;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public boolean isDemo() {
        return true;
    }

    public AuthProvider getAuthProvider() {
        return AuthProvider.LOCAL_DEMO;
    }

    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_DEMO_OPERATOR"));
    }
}
