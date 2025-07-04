package com.satyam.riskviewer_backend.dto;

import java.math.BigDecimal;
import java.util.Map;

public class AdvancedRiskMetricsDTO {
    private BigDecimal portfolioValue;
    private BigDecimal parametricVaR95;
    private BigDecimal parametricVaR99;
    private BigDecimal monteCarloVaR95;
    private BigDecimal monteCarloVaR99;
    private BigDecimal expectedShortfall95;
    private BigDecimal expectedShortfall99;
    private BigDecimal maxDrawdown;
    private BigDecimal portfolioBeta;
    private BigDecimal concentrationRisk;
    private BigDecimal sharpeRatio;
    private Map<String, BigDecimal> stressTestResults;
    private Map<String, BigDecimal> assetAllocation;
    
    // Constructors
    public AdvancedRiskMetricsDTO() {}
    
    public AdvancedRiskMetricsDTO(BigDecimal portfolioValue, BigDecimal parametricVaR95, 
                                 BigDecimal parametricVaR99, BigDecimal monteCarloVaR95,
                                 BigDecimal monteCarloVaR99, BigDecimal expectedShortfall95,
                                 BigDecimal expectedShortfall99, BigDecimal maxDrawdown,
                                 BigDecimal portfolioBeta, BigDecimal concentrationRisk,
                                 BigDecimal sharpeRatio, Map<String, BigDecimal> stressTestResults,
                                 Map<String, BigDecimal> assetAllocation) {
        this.portfolioValue = portfolioValue;
        this.parametricVaR95 = parametricVaR95;
        this.parametricVaR99 = parametricVaR99;
        this.monteCarloVaR95 = monteCarloVaR95;
        this.monteCarloVaR99 = monteCarloVaR99;
        this.expectedShortfall95 = expectedShortfall95;
        this.expectedShortfall99 = expectedShortfall99;
        this.maxDrawdown = maxDrawdown;
        this.portfolioBeta = portfolioBeta;
        this.concentrationRisk = concentrationRisk;
        this.sharpeRatio = sharpeRatio;
        this.stressTestResults = stressTestResults;
        this.assetAllocation = assetAllocation;
    }
    
    // Getters and Setters
    public BigDecimal getPortfolioValue() { return portfolioValue; }
    public void setPortfolioValue(BigDecimal portfolioValue) { this.portfolioValue = portfolioValue; }
    
    public BigDecimal getParametricVaR95() { return parametricVaR95; }
    public void setParametricVaR95(BigDecimal parametricVaR95) { this.parametricVaR95 = parametricVaR95; }
    
    public BigDecimal getParametricVaR99() { return parametricVaR99; }
    public void setParametricVaR99(BigDecimal parametricVaR99) { this.parametricVaR99 = parametricVaR99; }
    
    public BigDecimal getMonteCarloVaR95() { return monteCarloVaR95; }
    public void setMonteCarloVaR95(BigDecimal monteCarloVaR95) { this.monteCarloVaR95 = monteCarloVaR95; }
    
    public BigDecimal getMonteCarloVaR99() { return monteCarloVaR99; }
    public void setMonteCarloVaR99(BigDecimal monteCarloVaR99) { this.monteCarloVaR99 = monteCarloVaR99; }
    
    public BigDecimal getExpectedShortfall95() { return expectedShortfall95; }
    public void setExpectedShortfall95(BigDecimal expectedShortfall95) { this.expectedShortfall95 = expectedShortfall95; }
    
    public BigDecimal getExpectedShortfall99() { return expectedShortfall99; }
    public void setExpectedShortfall99(BigDecimal expectedShortfall99) { this.expectedShortfall99 = expectedShortfall99; }
    
    public BigDecimal getMaxDrawdown() { return maxDrawdown; }
    public void setMaxDrawdown(BigDecimal maxDrawdown) { this.maxDrawdown = maxDrawdown; }
    
    public BigDecimal getPortfolioBeta() { return portfolioBeta; }
    public void setPortfolioBeta(BigDecimal portfolioBeta) { this.portfolioBeta = portfolioBeta; }
    
    public BigDecimal getConcentrationRisk() { return concentrationRisk; }
    public void setConcentrationRisk(BigDecimal concentrationRisk) { this.concentrationRisk = concentrationRisk; }
    
    public BigDecimal getSharpeRatio() { return sharpeRatio; }
    public void setSharpeRatio(BigDecimal sharpeRatio) { this.sharpeRatio = sharpeRatio; }
    
    public Map<String, BigDecimal> getStressTestResults() { return stressTestResults; }
    public void setStressTestResults(Map<String, BigDecimal> stressTestResults) { this.stressTestResults = stressTestResults; }
    
    public Map<String, BigDecimal> getAssetAllocation() { return assetAllocation; }
    public void setAssetAllocation(Map<String, BigDecimal> assetAllocation) { this.assetAllocation = assetAllocation; }
}
