package com.satyam.riskviewer_backend.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.CrossOrigin;
import java.util.List;
import java.util.Optional;
import com.satyam.riskviewer_backend.model.Position;
import com.satyam.riskviewer_backend.repository.PositionRepository;


@RestController
@RequestMapping("/api")  // Base URL for all endpoints
@CrossOrigin(origins = "http://localhost:4200")  // Allow Angular to call these APIs
public class RiskController {
    private final PositionRepository positionRepository;

    public RiskController(PositionRepository positionRepository) {
        this.positionRepository = positionRepository;
    }

    @GetMapping("/positions")
    public List<Position> getAllPositions() {
        return positionRepository.findAll(); // Returns JSON automatically!
    }

    @GetMapping("/positions/{id}")
    public Optional<Position> getPositionById(@PathVariable Long id) {
        return positionRepository.findById(id); // Returns JSON or null
    }

    @GetMapping("/positions/portfolio/{portfolioId}")
    public List<Position> getPositionsByPortfolio(@PathVariable Long portfolioId) {
        return positionRepository.findByPortfolioId(portfolioId);
    }

    @GetMapping("/positions/symbol/{symbol}")
    public List<Position> getPositionsBySymbol(@PathVariable String symbol) {
        return positionRepository.findBySymbol(symbol);
    }
    
    
}
