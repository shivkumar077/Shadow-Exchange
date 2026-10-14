package com.shadowexchange.entity;

/**
 * Identifies the authentication provider that originated a user account.
 * - LOCAL_DEMO: Anonymous demo operator created locally.
 * - GOOGLE: Account authenticated via Google OpenID Connect (OIDC).
 */
public enum AuthProvider {
    LOCAL_DEMO,
    GOOGLE
}
