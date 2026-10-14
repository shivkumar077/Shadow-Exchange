package com.shadowexchange.security;

import com.shadowexchange.entity.User;
import com.shadowexchange.service.GoogleAccountProvisioningService;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

/**
 * Intercepts successful Google OpenID Connect token validations, extracts claims,
 * invokes GoogleAccountProvisioningService to find or provision the local User entity,
 * and attaches the internal database userId to the authenticated principal.
 */
@Service
public class CustomOidcUserService extends OidcUserService {

    private final GoogleAccountProvisioningService provisioningService;

    public CustomOidcUserService(GoogleAccountProvisioningService provisioningService) {
        this.provisioningService = provisioningService;
    }

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = super.loadUser(userRequest);

        String sub = oidcUser.getSubject();
        String email = oidcUser.getEmail();
        Boolean emailVerified = oidcUser.getEmailVerified();
        String name = oidcUser.getFullName();
        String picture = oidcUser.getPicture();

        User localUser = provisioningService.provisionOrUpdateGoogleUser(
                sub,
                email,
                emailVerified,
                name,
                picture
        );

        return new CustomOidcUser(localUser.getId(), oidcUser);
    }
}
