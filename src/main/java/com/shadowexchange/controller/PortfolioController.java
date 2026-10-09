package com.shadowexchange.controller;

import com.shadowexchange.dto.HoldingResponse;
import com.shadowexchange.service.PortfolioService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/{userId}/portfolio")
public class PortfolioController {
    private final PortfolioService portfolioService;

    public PortfolioController(PortfolioService portfolioService) {
        this.portfolioService = portfolioService;
    }

    @GetMapping
    public List<HoldingResponse> getPortfolio(@PathVariable Long userId) {
        return portfolioService.getPortfolio(userId);
    }
}
