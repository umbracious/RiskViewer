package com.satyam.riskviewer_backend.service;

import java.math.BigDecimal;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import com.satyam.riskviewer_backend.model.Position;
import com.satyam.riskviewer_backend.repository.PositionRepository;

@Service
public class DataLoaderService implements CommandLineRunner {

    private final PositionRepository positionRepository;

    public DataLoaderService(PositionRepository positionRepository) {
        this.positionRepository = positionRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Only load data if database is empty
        if (positionRepository.count() == 0) {
            System.out.println("Loading sample data...");
            loadInitialData();
            System.out.println("Sample data loaded successfully!");
        } else {
            System.out.println("Data already exists, skipping sample data loading.");
        }
    }

    public void loadInitialData() {
        // Portfolio 1: Tech Growth
        positionRepository.save(new Position("AAPL", "Equity", new BigDecimal("500"), new BigDecimal("145.50"), 1L));
        positionRepository.save(new Position("MSFT", "Equity", new BigDecimal("300"), new BigDecimal("280.00"), 1L));
        positionRepository.save(new Position("GOOGL", "Equity", new BigDecimal("150"), new BigDecimal("125.30"), 1L));
        
        // Portfolio 2: Diversified
        positionRepository.save(new Position("TSLA", "Equity", new BigDecimal("200"), new BigDecimal("240.00"), 2L));
        positionRepository.save(new Position("TLT", "Bond", new BigDecimal("250"), new BigDecimal("95.20"), 2L));
        positionRepository.save(new Position("SPY", "ETF", new BigDecimal("100"), new BigDecimal("420.00"), 2L));
        
        // Portfolio 3: High Growth
        positionRepository.save(new Position("NVDA", "Equity", new BigDecimal("75"), new BigDecimal("450.00"), 3L));
        positionRepository.save(new Position("VXX", "Derivative", new BigDecimal("500"), new BigDecimal("12.50"), 3L));
        positionRepository.save(new Position("AMZN", "Equity", new BigDecimal("80"), new BigDecimal("330.00"), 3L));
        positionRepository.save(new Position("BITO", "ETF", new BigDecimal("200"), new BigDecimal("28.50"), 3L));
    }
}
