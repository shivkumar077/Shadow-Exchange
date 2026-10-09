package com.shadowexchange.repository;

import com.shadowexchange.entity.Holding;
import com.shadowexchange.entity.Stock;
import com.shadowexchange.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HoldingRepository extends JpaRepository<Holding, Long> {

    Optional<Holding> findByUserIdAndStockId(Long userId, Long stockId);

    Optional<Holding> findByUserAndStock(User user, Stock stock);

    java.util.List<Holding> findByUserIdOrderByStockSymbolAsc(Long userId);
}
