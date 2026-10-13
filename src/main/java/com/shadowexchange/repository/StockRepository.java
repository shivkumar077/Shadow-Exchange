package com.shadowexchange.repository;

import com.shadowexchange.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StockRepository extends JpaRepository<Stock, Long> {

    Optional<Stock> findBySymbol(String symbol);

    boolean existsBySymbol(String symbol);

    List<Stock> findAllByOrderByIdAsc();
}
