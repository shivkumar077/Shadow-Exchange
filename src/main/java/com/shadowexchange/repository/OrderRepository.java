package com.shadowexchange.repository;

import com.shadowexchange.entity.Order;
import com.shadowexchange.entity.OrderStatus;
import com.shadowexchange.entity.OrderType;
import com.shadowexchange.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByStockAndStatusAndTypeOrderByPriceDesc(
            Stock stock,
            OrderStatus status,
            OrderType type
    );

    List<Order> findByStockAndStatusAndTypeOrderByPriceAsc(
            Stock stock,
            OrderStatus status,
            OrderType type
    );

}
