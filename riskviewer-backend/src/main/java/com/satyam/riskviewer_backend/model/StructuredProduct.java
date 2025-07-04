package com.satyam.riskviewer_backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "structured_products")
public class StructuredProduct {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String productCode;
    
    @Column(nullable = false)
    private String productType; // AUTOCALLABLE, BARRIER_REVERSE_CONVERTIBLE, EQUITY_LINKED_NOTE
    
    @Column(nullable = false)
    private String underlyingAsset;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal notionalAmount;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal strikePrice;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal barrierLevel;
    
    @Column(nullable = false, precision = 8, scale = 4)
    private BigDecimal couponRate;
    
    @Column(nullable = false)
    private LocalDateTime issueDate;
    
    @Column(nullable = false)
    private LocalDateTime maturityDate;
    
    @Column(nullable = false)
    private Long portfolioId;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal currentPrice;
    
    @Column(nullable = false, precision = 8, scale = 4)
    private BigDecimal impliedVolatility;
    
    @Column(nullable = false, precision = 8, scale = 4)
    private BigDecimal delta;
    
    @Column(nullable = false, precision = 8, scale = 4)
    private BigDecimal gamma;
    
    @Column(nullable = false, precision = 8, scale = 4)
    private BigDecimal theta;
    
    @Column(nullable = false, precision = 8, scale = 4)
    private BigDecimal vega;
    
    @Column(nullable = false)
    private String riskStatus; // GREEN, YELLOW, RED
    
    @ElementCollection
    @CollectionTable(name = "product_risk_scenarios", joinColumns = @JoinColumn(name = "product_id"))
    @MapKeyColumn(name = "scenario_name")
    @Column(name = "scenario_value")
    private Map<String, BigDecimal> riskScenarios;
    
    @Column
    private LocalDateTime lastUpdated;
    
    // Constructors
    public StructuredProduct() {
        this.lastUpdated = LocalDateTime.now();
    }
    
    public StructuredProduct(String productCode, String productType, String underlyingAsset,
                           BigDecimal notionalAmount, BigDecimal strikePrice, BigDecimal barrierLevel,
                           BigDecimal couponRate, LocalDateTime issueDate, LocalDateTime maturityDate,
                           Long portfolioId, BigDecimal currentPrice, BigDecimal impliedVolatility) {
        this();
        this.productCode = productCode;
        this.productType = productType;
        this.underlyingAsset = underlyingAsset;
        this.notionalAmount = notionalAmount;
        this.strikePrice = strikePrice;
        this.barrierLevel = barrierLevel;
        this.couponRate = couponRate;
        this.issueDate = issueDate;
        this.maturityDate = maturityDate;
        this.portfolioId = portfolioId;
        this.currentPrice = currentPrice;
        this.impliedVolatility = impliedVolatility;
        
        // Initialize Greeks to zero - will be calculated by pricing service
        this.delta = BigDecimal.ZERO;
        this.gamma = BigDecimal.ZERO;
        this.theta = BigDecimal.ZERO;
        this.vega = BigDecimal.ZERO;
        this.riskStatus = "GREEN";
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getProductCode() { return productCode; }
    public void setProductCode(String productCode) { this.productCode = productCode; }
    
    public String getProductType() { return productType; }
    public void setProductType(String productType) { this.productType = productType; }
    
    public String getUnderlyingAsset() { return underlyingAsset; }
    public void setUnderlyingAsset(String underlyingAsset) { this.underlyingAsset = underlyingAsset; }
    
    public BigDecimal getNotionalAmount() { return notionalAmount; }
    public void setNotionalAmount(BigDecimal notionalAmount) { this.notionalAmount = notionalAmount; }
    
    public BigDecimal getStrikePrice() { return strikePrice; }
    public void setStrikePrice(BigDecimal strikePrice) { this.strikePrice = strikePrice; }
    
    public BigDecimal getBarrierLevel() { return barrierLevel; }
    public void setBarrierLevel(BigDecimal barrierLevel) { this.barrierLevel = barrierLevel; }
    
    public BigDecimal getCouponRate() { return couponRate; }
    public void setCouponRate(BigDecimal couponRate) { this.couponRate = couponRate; }
    
    public LocalDateTime getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDateTime issueDate) { this.issueDate = issueDate; }
    
    public LocalDateTime getMaturityDate() { return maturityDate; }
    public void setMaturityDate(LocalDateTime maturityDate) { this.maturityDate = maturityDate; }
    
    public Long getPortfolioId() { return portfolioId; }
    public void setPortfolioId(Long portfolioId) { this.portfolioId = portfolioId; }
    
    public BigDecimal getCurrentPrice() { return currentPrice; }
    public void setCurrentPrice(BigDecimal currentPrice) { this.currentPrice = currentPrice; }
    
    public BigDecimal getImpliedVolatility() { return impliedVolatility; }
    public void setImpliedVolatility(BigDecimal impliedVolatility) { this.impliedVolatility = impliedVolatility; }
    
    public BigDecimal getDelta() { return delta; }
    public void setDelta(BigDecimal delta) { this.delta = delta; }
    
    public BigDecimal getGamma() { return gamma; }
    public void setGamma(BigDecimal gamma) { this.gamma = gamma; }
    
    public BigDecimal getTheta() { return theta; }
    public void setTheta(BigDecimal theta) { this.theta = theta; }
    
    public BigDecimal getVega() { return vega; }
    public void setVega(BigDecimal vega) { this.vega = vega; }
    
    public String getRiskStatus() { return riskStatus; }
    public void setRiskStatus(String riskStatus) { this.riskStatus = riskStatus; }
    
    public Map<String, BigDecimal> getRiskScenarios() { return riskScenarios; }
    public void setRiskScenarios(Map<String, BigDecimal> riskScenarios) { this.riskScenarios = riskScenarios; }
    
    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
}
