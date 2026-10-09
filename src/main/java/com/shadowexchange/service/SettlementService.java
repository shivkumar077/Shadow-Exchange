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

        // Validate the seller's shares before changing any balances or holdings.
        Holding sellerHolding = holdingRepository
                .findByUserAndStock(seller, trade.getStock())
                .orElseThrow(() -> new RuntimeException(
                        "Seller does not have the stock to sell"
                ));

        if (sellerHolding.getQuantity() < trade.getQuantity()) {
            throw new RuntimeException(
                    "Seller does not have enough stock to sell"
            );
        }

        if (sellerHolding.getReservedQuantity() == null
                || sellerHolding.getReservedQuantity() < trade.getQuantity()) {
            throw new RuntimeException(
                    "Seller does not have enough reserved shares to settle the trade"
            );
        }

        if (buyer.getReservedBalance() == null
                || buyer.getReservedBalance().compareTo(reservedAmount) < 0) {
            throw new RuntimeException(
                    "Buyer does not have enough reserved funds to settle the trade"
            );
        }

        // Release the buyer's reserved funds for the shares being traded.
        buyer.setReservedBalance(
                buyer.getReservedBalance().subtract(reservedAmount)
        );

        // Deduct the actual trade value, which may be lower than the limit price.
        buyer.setBalance(
                buyer.getBalance().subtract(tradeValue)
        );

        userRepository.save(buyer);

        // Credit the seller with the actual trade value.
        seller.setBalance(
                seller.getBalance().add(tradeValue)
        );

        userRepository.save(seller);

        // Add the traded shares to the buyer's existing holding, or create one.
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

        // Remove traded shares and release their reservation for the seller.
        sellerHolding.setQuantity(
                sellerHolding.getQuantity() - trade.getQuantity()
        );

        sellerHolding.setReservedQuantity(
                sellerHolding.getReservedQuantity() - trade.getQuantity()
        );

        holdingRepository.save(sellerHolding);
    }
}
