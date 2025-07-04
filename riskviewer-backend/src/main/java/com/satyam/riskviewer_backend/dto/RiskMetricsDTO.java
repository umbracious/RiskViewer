package com.satyam.riskviewer_backend.dto;

import java.math.BigDecimal;
import java.util.Map;

public class RiskMetricsDTO {
    private BigDecimal portfolioValue;
    private BigDecimal valueAtRisk95;
    private BigDecimal valueAtRisk99;
    private BigDecimal concentrationRisk;
    private BigDecimal sharpeRatio;
    private Map<String, BigDecimal> assetAllocation;
    
    // Constructors
    public RiskMetricsDTO() {}
    
    public RiskMetricsDTO(BigDecimal portfolioValue, BigDecimal valueAtRisk95, 
                         BigDecimal valueAtRisk99, BigDecimal concentrationRisk,
                         BigDecimal sharpeRatio, Map<String, BigDecimal> assetAllocation) {
        this.portfolioValue = portfolioValue;
        this.valueAtRisk95 = valueAtRisk95;
        this.valueAtRisk99 = valueAtRisk99;
        this.concentrationRisk = concentrationRisk;
        this.sharpeRatio = sharpeRatio;
        this.assetAllocation = assetAllocation;
    }
    
    // Getters and Setters
    public BigDecimal getPortfolioValue() { return portfolioValue; }
    public void setPortfolioValue(BigDecimal portfolioValue) { this.portfolioValue = portfolioValue; }
    
    public BigDecimal getValueAtRisk95() { return valueAtRisk95; }
    public void setValueAtRisk95(BigDecimal valueAtRisk95) { this.valueAtRisk95 = valueAtRisk95; }
    
    public BigDecimal getValueAtRisk99() { return valueAtRisk99; }
    public void setValueAtRisk99(BigDecimal valueAtRisk99) { this.valueAtRisk99 = valueAtRisk99; }
    
    public BigDecimal getConcentrationRisk() { return concentrationRisk; }
    public void setConcentrationRisk(BigDecimal concentrationRisk) { this.concentrationRisk = concentrationRisk; }
    
    public BigDecimal getSharpeRatio() { return sharpeRatio; }
    public void setSharpeRatio(BigDecimal sharpeRatio) { this.sharpeRatio = sharpeRatio; }
    
    public Map<String, BigDecimal> getAssetAllocation() { return assetAllocation; }
    public void setAssetAllocation(Map<String, BigDecimal> assetAllocation) { this.assetAllocation = assetAllocation; }
}