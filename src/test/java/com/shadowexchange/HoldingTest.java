package com.shadowexchange;

import com.shadowexchange.entity.Holding;
import com.shadowexchange.entity.Stock;
import com.shadowexchange.entity.User;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class HoldingTest {

    @Test
    void newHoldingShouldStartWithZeroReservedQuantity() {

        User user = new User();
        Stock stock = new Stock();

        Holding holding = new Holding(
                user,
                stock,
                50
        );

        assertEquals(50, holding.getQuantity());
        assertEquals(0, holding.getReservedQuantity());
    }
}
