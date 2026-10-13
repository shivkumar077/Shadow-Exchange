package com.shadowexchange.service;

import com.shadowexchange.dto.CreateStockRequest;
import com.shadowexchange.dto.StockResponse;
import com.shadowexchange.entity.Stock;
import com.shadowexchange.exception.ResourceNotFoundException;
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
        return stockRepository.findAllByOrderByIdAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    public StockResponse getStockById(Long id) {
        Stock stock = stockRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stock not found with ID: " + id));
        return toResponse(stock);
    }

    public StockResponse createStock(CreateStockRequest request) {
        Stock stock = new Stock(
                request.getSymbol(),
                request.getCompanyName(),
                request.getCurrentPrice()
        );

        Stock savedStock = stockRepository.save(stock);

        return toResponse(savedStock);
    }

    private StockResponse toResponse(Stock stock) {
        return new StockResponse(
                stock.getId(),
                stock.getSymbol(),
                stock.getCompanyName(),
                stock.getCurrentPrice()
        );
    }
}
