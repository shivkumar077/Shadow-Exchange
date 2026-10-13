package com.shadowexchange.config;

import com.shadowexchange.entity.Stock;
import com.shadowexchange.repository.StockRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Idempotently seeds the curated exchange instrument universe.
 *
 * Requirements:
 * - Preserves existing stock records, database IDs, holdings, orders, and trades.
 * - Seeds missing instruments by symbol without overwriting existing data.
 * - Supports repeated execution and restarts safely without duplicates.
 */
@Component
public class StockDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(StockDataInitializer.class);

    private final StockRepository stockRepository;

    public StockDataInitializer(StockRepository stockRepository) {
        this.stockRepository = stockRepository;
    }

    /**
     * Curated exchange instrument universe (28 liquid, major US equities).
     * The original 5 instruments are preserved in their exact order and reference values.
     */
    public static final List<Stock> INITIAL_UNIVERSE = List.of(
            // --- Core Foundation (Original 5 Instruments Preserved) ---
            new Stock("NVDA", "NVIDIA Corporation", new BigDecimal("142.87")),
            new Stock("AAPL", "Apple Inc.", new BigDecimal("231.42")),
            new Stock("MSFT", "Microsoft Corporation", new BigDecimal("428.76")),
            new Stock("TSLA", "Tesla, Inc.", new BigDecimal("338.29")),
            new Stock("AMZN", "Amazon.com, Inc.", new BigDecimal("214.19")),

            // --- Technology & Communications ---
            new Stock("GOOGL", "Alphabet Inc.", new BigDecimal("182.45")),
            new Stock("META", "Meta Platforms, Inc.", new BigDecimal("584.20")),
            new Stock("AMD", "Advanced Micro Devices, Inc.", new BigDecimal("156.30")),
            new Stock("AVGO", "Broadcom Inc.", new BigDecimal("178.60")),
            new Stock("CSCO", "Cisco Systems, Inc.", new BigDecimal("56.40")),
            new Stock("INTC", "Intel Corporation", new BigDecimal("22.85")),
            new Stock("NFLX", "Netflix, Inc.", new BigDecimal("704.50")),

            // --- Financial Services & Payments ---
            new Stock("JPM", "JPMorgan Chase & Co.", new BigDecimal("224.50")),
            new Stock("BAC", "Bank of America Corporation", new BigDecimal("42.15")),
            new Stock("GS", "The Goldman Sachs Group, Inc.", new BigDecimal("512.80")),
            new Stock("MS", "Morgan Stanley", new BigDecimal("118.70")),
            new Stock("V", "Visa Inc.", new BigDecimal("282.90")),
            new Stock("MA", "Mastercard Incorporated", new BigDecimal("492.30")),

            // --- Healthcare & Pharmaceuticals ---
            new Stock("JNJ", "Johnson & Johnson", new BigDecimal("161.20")),
            new Stock("UNH", "UnitedHealth Group Incorporated", new BigDecimal("572.40")),
            new Stock("PFE", "Pfizer Inc.", new BigDecimal("28.90")),
            new Stock("LLY", "Eli Lilly and Company", new BigDecimal("894.50")),

            // --- Consumer & Retail ---
            new Stock("WMT", "Walmart Inc.", new BigDecimal("80.60")),
            new Stock("COST", "Costco Wholesale Corporation", new BigDecimal("908.20")),
            new Stock("KO", "The Coca-Cola Company", new BigDecimal("67.50")),
            new Stock("PEP", "PepsiCo, Inc.", new BigDecimal("169.80")),

            // --- Energy, Industrials & Aerospace ---
            new Stock("XOM", "Exxon Mobil Corporation", new BigDecimal("121.40")),
            new Stock("BA", "The Boeing Company", new BigDecimal("154.70"))
    );

    @Override
    @Transactional
    public void run(String... args) {
        seedMissingStocks();
    }

    /**
     * Seeds missing stocks by symbol into the database idempotently.
     *
     * @return the list of newly created Stock entities (empty if already up to date).
     */
    @Transactional
    public List<Stock> seedMissingStocks() {
        Set<String> existingSymbols = stockRepository.findAll().stream()
                .map(Stock::getSymbol)
                .collect(Collectors.toSet());

        List<Stock> toInsert = INITIAL_UNIVERSE.stream()
                .filter(stock -> !existingSymbols.contains(stock.getSymbol()))
                .map(stock -> new Stock(stock.getSymbol(), stock.getCompanyName(), stock.getCurrentPrice()))
                .toList();

        if (!toInsert.isEmpty()) {
            List<Stock> saved = stockRepository.saveAll(toInsert);
            log.info("Seeded {} new exchange instruments into database (total available: {}).",
                    saved.size(), existingSymbols.size() + saved.size());
            return saved;
        } else {
            log.info("Instrument universe is up-to-date ({} instruments verified).", existingSymbols.size());
            return List.of();
        }
    }
}
