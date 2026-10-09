package com.shadowexchange.config;

import com.shadowexchange.entity.Stock;
import com.shadowexchange.repository.StockRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/**
 * Seeds a small set of simulated instruments for a fresh local development database.
 * Existing stock records are never overwritten.
 */
@Component
public class StockDataInitializer implements CommandLineRunner {

    private final StockRepository stockRepository;

    public StockDataInitializer(StockRepository stockRepository) {
        this.stockRepository = stockRepository;
    }

    @Override
    public void run(String... args) {
        if (stockRepository.count() > 0) {
            return;
        }

        stockRepository.saveAll(List.of(
                new Stock("NVDA", "NVIDIA Corporation", new BigDecimal("142.87")),
                new Stock("AAPL", "Apple Inc.", new BigDecimal("231.42")),
                new Stock("MSFT", "Microsoft Corporation", new BigDecimal("428.76")),
                new Stock("TSLA", "Tesla, Inc.", new BigDecimal("338.29")),
                new Stock("AMZN", "Amazon.com, Inc.", new BigDecimal("214.19"))
        ));
    }
}
