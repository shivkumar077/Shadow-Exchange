package com.shadowexchange.repository;

import com.shadowexchange.entity.Order;
import com.shadowexchange.entity.OrderStatus;
import com.shadowexchange.entity.OrderType;
import com.shadowexchange.entity.Stock;

import java.util.Collection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

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

    List<Order> findByStockAndStatusInAndTypeOrderByPriceDescCreatedAtAsc(
            Stock stock,
            Collection<OrderStatus> statuses,
            OrderType type
    );

    List<Order> findByStockAndStatusInAndTypeOrderByPriceAscCreatedAtAsc(
            Stock stock,
            Collection<OrderStatus> statuses,
            OrderType type
    );

}
