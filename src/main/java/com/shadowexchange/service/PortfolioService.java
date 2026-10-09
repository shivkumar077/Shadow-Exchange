package com.shadowexchange.service;

import com.shadowexchange.dto.HoldingResponse;
import com.shadowexchange.entity.Holding;
import com.shadowexchange.repository.HoldingRepository;
import com.shadowexchange.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PortfolioService {
    private final HoldingRepository holdingRepository;
    private final UserRepository userRepository;

    public PortfolioService(HoldingRepository holdingRepository, UserRepository userRepository) {
        this.holdingRepository = holdingRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<HoldingResponse> getPortfolio(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found");
        }

        return holdingRepository.findByUserIdOrderByStockSymbolAsc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private HoldingResponse toResponse(Holding holding) {
        return new HoldingResponse(
                holding.getId(),
                holding.getStock().getId(),
                holding.getStock().getSymbol(),
                holding.getStock().getCompanyName(),
                holding.getStock().getCurrentPrice(),
                holding.getQuantity(),
                holding.getReservedQuantity()
        );
    }
}
