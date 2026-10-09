package com.shadowexchange.service;

import com.shadowexchange.dto.CreateStockRequest;
import com.shadowexchange.dto.StockResponse;
import com.shadowexchange.entity.Stock;
import com.shadowexchange.repository.StockRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StockService {

    private final StockRepository stockRepository;

    public StockService(StockRepository stockRepository) {
        this.stockRepository = stockRepository;
    }

    public List<StockResponse> getAllStocks() {
        return stockRepository.findAll().stream()
                .map(stock -> new StockResponse(
                        stock.getId(),
                        stock.getSymbol(),
                        stock.getCompanyName(),
                        stock.getCurrentPrice()
                ))
                .toList();
    }

    public StockResponse createStock(CreateStockRequest request) {
        Stock stock = new Stock(
                request.getSymbol(),
                request.getCompanyName(),
                request.getCurrentPrice()
        );

        Stock savedStock = stockRepository.save(stock);

        return new StockResponse(
                savedStock.getId(),
                savedStock.getSymbol(),
                savedStock.getCompanyName(),
                savedStock.getCurrentPrice()
        );
    }
}
