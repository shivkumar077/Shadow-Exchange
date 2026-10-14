package com.shadowexchange.controller;

import com.shadowexchange.dto.CreateUserRequest;
import com.shadowexchange.dto.UserResponse;
import com.shadowexchange.security.DemoAuthenticationToken;
import com.shadowexchange.security.DemoUserPrincipal;
import com.shadowexchange.security.SecurityUserHelper;
import com.shadowexchange.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final SecurityUserHelper securityUserHelper;
    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    public UserController(UserService userService, SecurityUserHelper securityUserHelper) {
        this.userService = userService;
        this.securityUserHelper = securityUserHelper;
    }

    @PostMapping
    public UserResponse createUser(@RequestBody CreateUserRequest request) {
        return userService.createUser(request);
    }

    /**
     * Issues a new demo account and binds it to the caller's server-side session.
     * Prevents callers from claiming or accessing another demo account's numeric ID.
     */
    @PostMapping("/demo")
    public UserResponse createDemoUser(HttpServletRequest request, HttpServletResponse response) {
        UserResponse demoUser = userService.createDemoUser();

        DemoUserPrincipal principal = new DemoUserPrincipal(
                demoUser.getId(),
                demoUser.getUsername(),
                demoUser.getEmail()
        );
        DemoAuthenticationToken authentication = new DemoAuthenticationToken(principal);

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        securityContextRepository.saveContext(context, request, response);

        return demoUser;
    }

    @GetMapping("/{userId}")
    public UserResponse getUserById(@PathVariable Long userId) {
        Long actingUserId = securityUserHelper.requireCurrentUserId();
        if (!actingUserId.equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot view account details of another user");
        }
        return userService.getUser(userId);
    }
}

