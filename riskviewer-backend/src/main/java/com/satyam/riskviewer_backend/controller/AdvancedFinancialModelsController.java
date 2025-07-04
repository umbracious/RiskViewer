package com.satyam.riskviewer_backend.controller;

import com.satyam.riskviewer_backend.service.AdvancedFinancialModelsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/advanced-models")
@CrossOrigin(origins = "http://localhost:4200")
public class AdvancedFinancialModelsController {

    @Autowired
    private AdvancedFinancialModelsService advancedModelsService;

    @PostMapping("/black-scholes")
    public ResponseEntity<Map<String, Object>> calculateBlackScholes(
            @RequestParam double spotPrice,
            @RequestParam double strikePrice,
            @RequestParam double timeToExpiry,
            @RequestParam double riskFreeRate,
            @RequestParam double volatility,
            @RequestParam(defaultValue = "0") double dividendYield) {
        
        Map<String, Object> result = advancedModelsService.calculateBlackScholes(
                spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility, dividendYield);
        
        return ResponseEntity.ok(result);
    }

    @PostMapping("/credit-risk")
    public ResponseEntity<Map<String, Object>> calculateCreditRisk(
            @RequestParam double creditScore,
            @RequestParam double debtToEquity,
            @RequestParam double currentRatio,
            @RequestParam double interestCoverage,
            @RequestParam double industryRisk,
            @RequestParam double exposureAmount) {
        
        Map<String, Object> result = advancedModelsService.calculateCreditRisk(
                creditScore, debtToEquity, currentRatio, interestCoverage, industryRisk, exposureAmount);
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/stress-tests")
    public ResponseEntity<List<Map<String, Object>>> performStressTests(
            @RequestParam double portfolioValue) {
        
        List<Map<String, Object>> results = advancedModelsService.performStressTests(portfolioValue);
        return ResponseEntity.ok(results);
    }

    @PostMapping("/liquidity-metrics")
    public ResponseEntity<Map<String, Object>> calculateLiquidityMetrics(
            @RequestParam double cashAndEquivalents,
            @RequestParam double liquidSecurities,
            @RequestParam double totalAssets,
            @RequestParam double shortTermLiabilities,
            @RequestParam double totalLiabilities) {
        
        Map<String, Object> result = advancedModelsService.calculateLiquidityMetrics(
                cashAndEquivalents, liquidSecurities, totalAssets, shortTermLiabilities, totalLiabilities);
        
        return ResponseEntity.ok(result);
    }

    // Batch calculation endpoint for comprehensive risk assessment
    @PostMapping("/comprehensive-assessment")
    public ResponseEntity<Map<String, Object>> performComprehensiveAssessment(
            @RequestBody Map<String, Object> portfolioData) {
        
        double portfolioValue = ((Number) portfolioData.get("portfolioValue")).doubleValue();
        
        // Perform stress tests
        List<Map<String, Object>> stressTests = advancedModelsService.performStressTests(portfolioValue);
        
        // Calculate sample Black-Scholes for major holdings
        Map<String, Object> blackScholes = advancedModelsService.calculateBlackScholes(
                175.0, 180.0, 0.25, 0.05, 0.25, 0.02); // Sample AAPL option
        
        // Calculate credit risk metrics
        Map<String, Object> creditRisk = advancedModelsService.calculateCreditRisk(
                750, 0.5, 2.1, 8.5, 3.2, portfolioValue * 0.3);
        
        // Calculate liquidity metrics
        Map<String, Object> liquidityMetrics = advancedModelsService.calculateLiquidityMetrics(
                portfolioValue * 0.1, portfolioValue * 0.2, portfolioValue,
                portfolioValue * 0.15, portfolioValue * 0.4);
        
        // Compile comprehensive results
        Map<String, Object> comprehensiveResults = Map.of(
                "stressTestResults", stressTests,
                "blackScholesExample", blackScholes,
                "creditRiskAssessment", creditRisk,
                "liquidityMetrics", liquidityMetrics,
                "assessmentTimestamp", System.currentTimeMillis(),
                "portfolioValue", portfolioValue
        );
        
        return ResponseEntity.ok(comprehensiveResults);
    }
}
