package com.shadowexchange.service;

import com.shadowexchange.entity.Holding;
import com.shadowexchange.entity.Trade;
import com.shadowexchange.entity.User;
import com.shadowexchange.repository.HoldingRepository;
import com.shadowexchange.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class SettlementService {

    private final HoldingRepository holdingRepository;
    private final UserRepository userRepository;

    public SettlementService(HoldingRepository holdingRepository, UserRepository userRepository) {
        this.holdingRepository = holdingRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void settleTrade(Trade trade) {

        User buyer = trade.getBuyer();
        User seller = trade.getSeller();

        BigDecimal tradeValue = trade.getPrice()
                .multiply(BigDecimal.valueOf(trade.getQuantity()));

        BigDecimal buyPrice = trade.getBuyOrder() != null
                ? trade.getBuyOrder().getPrice()
                : trade.getPrice();

        BigDecimal reservedAmount = buyPrice
                .multiply(BigDecimal.valueOf(trade.getQuantity()));

        // Release buyer's reserved money
        if (buyer.getReservedBalance() != null) {
            buyer.setReservedBalance(
                    buyer.getReservedBalance().subtract(reservedAmount)
            );
        }

        // Deduct actual trade value from buyer
        buyer.setBalance(
                buyer.getBalance().subtract(tradeValue)
        );

        userRepository.save(buyer);

        // Give seller the money
        seller.setBalance(
                seller.getBalance().add(tradeValue)
        );

        userRepository.save(seller);

        // Add shares to buyer
        Holding buyerHolding = holdingRepository
                .findByUserAndStock(buyer, trade.getStock())
                .orElse(null);

        if (buyerHolding != null) {

            buyerHolding.setQuantity(
                    buyerHolding.getQuantity() + trade.getQuantity()
            );

            holdingRepository.save(buyerHolding);

        } else {

            Holding newHolding = new Holding(
                    buyer,
                    trade.getStock(),
                    trade.getQuantity()
            );

            holdingRepository.save(newHolding);
        }

        // Remove shares from seller
        Holding sellerHolding = holdingRepository
                .findByUserAndStock(seller, trade.getStock())
                .orElse(null);

        if (sellerHolding == null) {
            throw new RuntimeException(
                    "Seller does not have the stock to sell"
            );
        }

        if (sellerHolding.getQuantity() < trade.getQuantity()) {
            throw new RuntimeException(
                    "Seller does not have enough stock to sell"
            );
        }

        sellerHolding.setQuantity(
                sellerHolding.getQuantity() - trade.getQuantity()
        );

        // Release seller's reserved shares
        if (sellerHolding.getReservedQuantity() != null) {
            sellerHolding.setReservedQuantity(
                    sellerHolding.getReservedQuantity() - trade.getQuantity()
            );
        }

        holdingRepository.save(sellerHolding);
    }
}