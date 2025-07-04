package com.satyam.riskviewer_backend.controller;

import java.math.BigDecimal;
import java.util.Map;

import org.springframework.web.bind.annotation.*;

import com.satyam.riskviewer_backend.dto.RiskMetricsDTO;
import com.satyam.riskviewer_backend.dto.AdvancedRiskMetricsDTO;
import com.satyam.riskviewer_backend.service.RiskAnalyticsService;

@RestController
@RequestMapping("/api/risk")
@CrossOrigin(origins = "http://localhost:4200")
public class RiskAnalyticsController {
    
    private final RiskAnalyticsService riskAnalyticsService;
    
    public RiskAnalyticsController(RiskAnalyticsService riskAnalyticsService) {
        this.riskAnalyticsService = riskAnalyticsService;
    }
    
    @GetMapping("/portfolio/{portfolioId}/metrics")
    public RiskMetricsDTO getPortfolioRiskMetrics(@PathVariable Long portfolioId) {
        BigDecimal portfolioValue = riskAnalyticsService.calculatePortfolioValue(portfolioId);
        BigDecimal var95 = riskAnalyticsService.calculatePortfolioVaR(portfolioId, 0.95);
        BigDecimal var99 = riskAnalyticsService.calculatePortfolioVaR(portfolioId, 0.99);
        BigDecimal concentrationRisk = riskAnalyticsService.calculateConcentrationRisk(portfolioId);
        BigDecimal sharpeRatio = riskAnalyticsService.calculateSharpeRatio(portfolioId);
        Map<String, BigDecimal> assetAllocation = riskAnalyticsService.calculateAssetAllocation(portfolioId);
        
        return new RiskMetricsDTO(portfolioValue, var95, var99, concentrationRisk, sharpeRatio, assetAllocation);
    }
    
    @GetMapping("/portfolio/{portfolioId}/var")
    public BigDecimal getValueAtRisk(@PathVariable Long portfolioId, 
                                   @RequestParam(defaultValue = "0.95") double confidence) {
        return riskAnalyticsService.calculatePortfolioVaR(portfolioId, confidence);
    }
    
    @GetMapping("/portfolio/{portfolioId}/allocation")
    public Map<String, BigDecimal> getAssetAllocation(@PathVariable Long portfolioId) {
        return riskAnalyticsService.calculateAssetAllocation(portfolioId);
    }
    
    @GetMapping("/portfolio/{portfolioId}/advanced-metrics")
    public AdvancedRiskMetricsDTO getAdvancedRiskMetrics(@PathVariable Long portfolioId) {
        BigDecimal portfolioValue = riskAnalyticsService.calculatePortfolioValue(portfolioId);
        BigDecimal parametricVaR95 = riskAnalyticsService.calculatePortfolioVaR(portfolioId, 0.95);
        BigDecimal parametricVaR99 = riskAnalyticsService.calculatePortfolioVaR(portfolioId, 0.99);
        BigDecimal monteCarloVaR95 = riskAnalyticsService.calculateMonteCarloVaR(portfolioId, 0.95, 10000);
        BigDecimal monteCarloVaR99 = riskAnalyticsService.calculateMonteCarloVaR(portfolioId, 0.99, 10000);
        BigDecimal expectedShortfall95 = riskAnalyticsService.calculateExpectedShortfall(portfolioId, 0.95);
        BigDecimal expectedShortfall99 = riskAnalyticsService.calculateExpectedShortfall(portfolioId, 0.99);
        BigDecimal maxDrawdown = riskAnalyticsService.calculateMaxDrawdown(portfolioId, 252); // 1 year
        BigDecimal portfolioBeta = riskAnalyticsService.calculatePortfolioBeta(portfolioId);
        BigDecimal concentrationRisk = riskAnalyticsService.calculateConcentrationRisk(portfolioId);
        BigDecimal sharpeRatio = riskAnalyticsService.calculateSharpeRatio(portfolioId);
        Map<String, BigDecimal> stressTestResults = riskAnalyticsService.runStressTests(portfolioId);
        Map<String, BigDecimal> assetAllocation = riskAnalyticsService.calculateAssetAllocation(portfolioId);
        
        return new AdvancedRiskMetricsDTO(portfolioValue, parametricVaR95, parametricVaR99,
                                         monteCarloVaR95, monteCarloVaR99, expectedShortfall95,
                                         expectedShortfall99, maxDrawdown, portfolioBeta,
                                         concentrationRisk, sharpeRatio, stressTestResults,
                                         assetAllocation);
    }
    
    @GetMapping("/portfolio/{portfolioId}/monte-carlo-var")
    public BigDecimal getMonteCarloVaR(@PathVariable Long portfolioId,
                                      @RequestParam(defaultValue = "0.95") double confidence,
                                      @RequestParam(defaultValue = "10000") int simulations) {
        return riskAnalyticsService.calculateMonteCarloVaR(portfolioId, confidence, simulations);
    }
    
    @GetMapping("/portfolio/{portfolioId}/stress-tests")
    public Map<String, BigDecimal> getStressTests(@PathVariable Long portfolioId) {
        return riskAnalyticsService.runStressTests(portfolioId);
    }
    
    @GetMapping("/portfolio/{portfolioId}/expected-shortfall")
    public BigDecimal getExpectedShortfall(@PathVariable Long portfolioId,
                                          @RequestParam(defaultValue = "0.95") double confidence) {
        return riskAnalyticsService.calculateExpectedShortfall(portfolioId, confidence);
    }
    
    @GetMapping("/portfolio/{portfolioId}/max-drawdown")
    public BigDecimal getMaxDrawdown(@PathVariable Long portfolioId,
                                    @RequestParam(defaultValue = "252") int days) {
        return riskAnalyticsService.calculateMaxDrawdown(portfolioId, days);
    }
    
    @GetMapping("/portfolio/{portfolioId}/beta")
    public BigDecimal getPortfolioBeta(@PathVariable Long portfolioId) {
        return riskAnalyticsService.calculatePortfolioBeta(portfolioId);
    }
}