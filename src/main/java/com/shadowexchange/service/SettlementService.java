package com.shadowexchange.service;

import com.shadowexchange.repository.HoldingRepository;
import com.shadowexchange.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class SettlementService {

    private final HoldingRepository holdingRepository;
    private final UserRepository userRepository;

    public SettlementService(HoldingRepository holdingRepository, UserRepository userRepository) {
        this.holdingRepository = holdingRepository;
        this.userRepository = userRepository;
    }
    
}
