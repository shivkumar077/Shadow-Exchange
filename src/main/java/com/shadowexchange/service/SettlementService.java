package com.shadowexchange.service;

import com.shadowexchange.entity.Trade;
import com.shadowexchange.entity.User;
import com.shadowexchange.repository.HoldingRepository;
import com.shadowexchange.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class SettlementService {

    private final HoldingRepository holdingRepository;
    private final UserRepository userRepository;

    public SettlementService(HoldingRepository holdingRepository, UserRepository userRepository) {
        this.holdingRepository = holdingRepository;
        this.userRepository = userRepository;
    }

    public void settleTrade(Trade trade){

        User buyer = trade.getBuyer();
        User seller = trade.getSeller();

        BigDecimal tradeValue = trade.getPrice()
                .multiply(BigDecimal.valueOf(trade.getQuantity()));

        BigDecimal reservedAmount = trade.getPrice()
                .multiply(BigDecimal.valueOf(trade.getQuantity()));

        buyer.setBalance(buyer.getBalance().subtract(tradeValue));
    }
}
