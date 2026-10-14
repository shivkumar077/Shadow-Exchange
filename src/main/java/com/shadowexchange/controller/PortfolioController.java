package com.shadowexchange.controller;

import com.shadowexchange.dto.HoldingResponse;
import com.shadowexchange.security.SecurityUserHelper;
import com.shadowexchange.service.PortfolioService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/users/{userId}/portfolio")
public class PortfolioController {

    private final PortfolioService portfolioService;
    private final SecurityUserHelper securityUserHelper;

    public PortfolioController(PortfolioService portfolioService, SecurityUserHelper securityUserHelper) {
        this.portfolioService = portfolioService;
        this.securityUserHelper = securityUserHelper;
    }

    @GetMapping
    public List<HoldingResponse> getPortfolio(@PathVariable Long userId) {
        Long actingUserId = securityUserHelper.requireCurrentUserId();
        if (!actingUserId.equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot view portfolio of another user");
        }
        return portfolioService.getPortfolio(userId);
    }
}

