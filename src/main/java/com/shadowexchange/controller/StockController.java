package com.shadowexchange.controller;


import com.shadowexchange.dto.CreateStockRequest;
import com.shadowexchange.dto.StockResponse;
import com.shadowexchange.service.StockService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stocks")
public class StockController {

    private final StockService stockService;

    public StockController(StockService stockService) {
        this.stockService = stockService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StockResponse createStock(@RequestBody @Valid CreateStockRequest request) {
        return stockService.createStock(request);
    }
}
