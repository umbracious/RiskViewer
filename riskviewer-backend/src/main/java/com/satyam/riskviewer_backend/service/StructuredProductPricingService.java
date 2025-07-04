package com.satyam.riskviewer_backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

import org.springframework.stereotype.Service;

import com.satyam.riskviewer_backend.model.StructuredProduct;
import com.satyam.riskviewer_backend.repository.StructuredProductRepository;

@Service
public class StructuredProductPricingService {
    
    private final StructuredProductRepository structuredProductRepository;
    
    public StructuredProductPricingService(StructuredProductRepository structuredProductRepository) {
        this.structuredProductRepository = structuredProductRepository;
    }
    
    /**
     * Calculate Black-Scholes price for structured products
     */
    public BigDecimal calculateBlackScholesPrice(StructuredProduct product) {
        double S = product.getCurrentPrice().doubleValue();  // Current price
        double K = product.getStrikePrice().doubleValue();   // Strike price
        double T = getTimeToMaturity(product);               // Time to maturity
        double r = 0.05;  // Risk-free rate (5%)
        double sigma = product.getImpliedVolatility().doubleValue(); // Volatility
        
        if (T <= 0) {
            return product.getCurrentPrice(); // Already matured
        }
        
        double d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
        double d2 = d1 - sigma * Math.sqrt(T);
        
        double callPrice = S * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2);
        
        // Adjust for product type
        double productPrice = adjustForProductType(callPrice, product, S, K, T, r, sigma);
        
        return BigDecimal.valueOf(productPrice).setScale(2, RoundingMode.HALF_UP);
    }
    
    /**
     * Calculate Greeks for risk management
     */
    public void calculateGreeks(StructuredProduct product) {
        double S = product.getCurrentPrice().doubleValue();
        double K = product.getStrikePrice().doubleValue();
        double T = getTimeToMaturity(product);
        double r = 0.05;
        double sigma = product.getImpliedVolatility().doubleValue();
        
        if (T <= 0) {
            // Product has matured - Greeks are zero
            product.setDelta(BigDecimal.ZERO);
            product.setGamma(BigDecimal.ZERO);
            product.setTheta(BigDecimal.ZERO);
            product.setVega(BigDecimal.ZERO);
            return;
        }
        
        double d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
        double d2 = d1 - sigma * Math.sqrt(T);
        
        // Delta: sensitivity to underlying price changes
        double delta = normalCDF(d1);
        product.setDelta(BigDecimal.valueOf(delta).setScale(4, RoundingMode.HALF_UP));
        
        // Gamma: rate of change of delta
        double gamma = normalPDF(d1) / (S * sigma * Math.sqrt(T));
        product.setGamma(BigDecimal.valueOf(gamma).setScale(4, RoundingMode.HALF_UP));
        
        // Theta: time decay
        double theta = -(S * normalPDF(d1) * sigma) / (2 * Math.sqrt(T)) 
                      - r * K * Math.exp(-r * T) * normalCDF(d2);
        product.setTheta(BigDecimal.valueOf(theta / 365).setScale(4, RoundingMode.HALF_UP)); // Per day
        
        // Vega: sensitivity to volatility
        double vega = S * Math.sqrt(T) * normalPDF(d1) / 100; // Per 1% vol change
        product.setVega(BigDecimal.valueOf(vega).setScale(4, RoundingMode.HALF_UP));
    }
    
    /**
     * Run comprehensive risk scenarios for structured products
     */
    public Map<String, BigDecimal> runStructuredProductStressTests(StructuredProduct product) {
        Map<String, BigDecimal> results = new HashMap<>();
        BigDecimal currentValue = calculateBlackScholesPrice(product);
        
        // Scenario 1: 20% market drop
        BigDecimal marketCrashValue = calculateScenarioValue(product, -0.20, 0.0, 0.0);
        results.put("Market Crash (-20%)", currentValue.subtract(marketCrashValue));
        
        // Scenario 2: 50% volatility spike
        BigDecimal volSpike = calculateScenarioValue(product, 0.0, 0.5, 0.0);
        results.put("Volatility Spike (+50%)", volSpike.subtract(currentValue));
        
        // Scenario 3: Interest rate rise (+200bps)
        BigDecimal rateRise = calculateScenarioValue(product, 0.0, 0.0, 0.02);
        results.put("Rate Rise (+200bps)", rateRise.subtract(currentValue));
        
        // Scenario 4: Barrier breach scenario
        if (product.getBarrierLevel() != null) {
            BigDecimal barrierBreach = calculateBarrierBreachValue(product);
            results.put("Barrier Breach", currentValue.subtract(barrierBreach));
        }
        
        // Scenario 5: Time decay (30 days)
        BigDecimal timeDcay = calculateTimeDecayValue(product, 30);
        results.put("Time Decay (30d)", currentValue.subtract(timeDcay));
        
        return results;
    }
    
    /**
     * Calculate scenario value with market moves
     */
    private BigDecimal calculateScenarioValue(StructuredProduct product, double priceShock, 
                                            double volShock, double rateShock) {
        StructuredProduct scenarioProduct = cloneProduct(product);
        
        // Apply shocks
        BigDecimal newPrice = product.getCurrentPrice()
            .multiply(BigDecimal.valueOf(1 + priceShock));
        scenarioProduct.setCurrentPrice(newPrice);
        
        BigDecimal newVol = product.getImpliedVolatility()
            .multiply(BigDecimal.valueOf(1 + volShock));
        scenarioProduct.setImpliedVolatility(newVol);
        
        return calculateBlackScholesPrice(scenarioProduct);
    }
    
    /**
     * Calculate barrier breach impact
     */
    private BigDecimal calculateBarrierBreachValue(StructuredProduct product) {
        // If barrier is breached, product converts to worst-performing underlying
        BigDecimal barrierLevel = product.getBarrierLevel();
        BigDecimal currentPrice = product.getCurrentPrice();
        
        if (currentPrice.compareTo(barrierLevel) < 0) {
            // Barrier breached - calculate conversion value
            BigDecimal conversionRatio = product.getNotionalAmount().divide(product.getStrikePrice(), 4, RoundingMode.HALF_UP);
            return conversionRatio.multiply(currentPrice);
        }
        
        return calculateBlackScholesPrice(product);
    }
    
    /**
     * Calculate time decay impact
     */
    private BigDecimal calculateTimeDecayValue(StructuredProduct product, int daysForward) {
        StructuredProduct futureProduct = cloneProduct(product);
        LocalDateTime futureDate = product.getLastUpdated().plusDays(daysForward);
        futureProduct.setLastUpdated(futureDate);
        
        return calculateBlackScholesPrice(futureProduct);
    }
    
    /**
     * Assess overall risk status
     */
    public void assessRiskStatus(StructuredProduct product) {
        calculateGreeks(product);
        
        double delta = product.getDelta().doubleValue();
        double gamma = product.getGamma().doubleValue();
        double vega = product.getVega().doubleValue();
        
        // Risk scoring based on Greeks
        int riskScore = 0;
        
        if (Math.abs(delta) > 0.7) riskScore += 2;
        else if (Math.abs(delta) > 0.5) riskScore += 1;
        
        if (gamma > 0.01) riskScore += 2;
        else if (gamma > 0.005) riskScore += 1;
        
        if (Math.abs(vega) > 0.1) riskScore += 2;
        else if (Math.abs(vega) > 0.05) riskScore += 1;
        
        // Check time to maturity
        double timeToMaturity = getTimeToMaturity(product);
        if (timeToMaturity < 0.25) riskScore += 2; // Less than 3 months
        else if (timeToMaturity < 0.5) riskScore += 1; // Less than 6 months
        
        // Check barrier proximity
        if (product.getBarrierLevel() != null) {
            double barrierDistance = product.getCurrentPrice().doubleValue() / product.getBarrierLevel().doubleValue();
            if (barrierDistance < 1.1) riskScore += 3; // Within 10% of barrier
            else if (barrierDistance < 1.2) riskScore += 2; // Within 20% of barrier
        }
        
        // Set risk status
        if (riskScore >= 5) {
            product.setRiskStatus("RED");
        } else if (riskScore >= 3) {
            product.setRiskStatus("YELLOW");
        } else {
            product.setRiskStatus("GREEN");
        }
    }
    
    // Helper methods
    private double adjustForProductType(double basePrice, StructuredProduct product, 
                                      double S, double K, double T, double r, double sigma) {
        switch (product.getProductType()) {
            case "AUTOCALLABLE":
                // Autocallable notes have early redemption features
                return basePrice * 0.95; // Discount for autocall feature
                
            case "BARRIER_REVERSE_CONVERTIBLE":
                // BRC has downside barrier protection
                double barrierAdjustment = calculateBarrierAdjustment(product, S, T, r, sigma);
                return basePrice + barrierAdjustment;
                
            case "EQUITY_LINKED_NOTE":
                // Standard equity-linked note
                return basePrice;
                
            default:
                return basePrice;
        }
    }
    
    private double calculateBarrierAdjustment(StructuredProduct product, double S, double T, double r, double sigma) {
        if (product.getBarrierLevel() == null) return 0.0;
        
        double barrier = product.getBarrierLevel().doubleValue();
        double barrierDistance = S / barrier;
        
        // Monte Carlo estimation of barrier breach probability
        double breachProbability = estimateBarrierBreachProbability(S, barrier, T, sigma, 1000);
        
        // Adjust price based on breach probability
        return -breachProbability * S * 0.5; // Simplified adjustment
    }
    
    private double estimateBarrierBreachProbability(double S, double barrier, double T, double sigma, int simulations) {
        Random random = new Random(12345);
        int breaches = 0;
        
        for (int i = 0; i < simulations; i++) {
            double finalPrice = S * Math.exp((0.05 - 0.5 * sigma * sigma) * T + sigma * Math.sqrt(T) * random.nextGaussian());
            if (finalPrice < barrier) {
                breaches++;
            }
        }
        
        return (double) breaches / simulations;
    }
    
    private double getTimeToMaturity(StructuredProduct product) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime maturity = product.getMaturityDate();
        
        if (now.isAfter(maturity)) {
            return 0.0;
        }
        
        long days = ChronoUnit.DAYS.between(now, maturity);
        return days / 365.0; // Convert to years
    }
    
    private StructuredProduct cloneProduct(StructuredProduct original) {
        StructuredProduct clone = new StructuredProduct();
        clone.setProductCode(original.getProductCode());
        clone.setProductType(original.getProductType());
        clone.setUnderlyingAsset(original.getUnderlyingAsset());
        clone.setNotionalAmount(original.getNotionalAmount());
        clone.setStrikePrice(original.getStrikePrice());
        clone.setBarrierLevel(original.getBarrierLevel());
        clone.setCouponRate(original.getCouponRate());
        clone.setIssueDate(original.getIssueDate());
        clone.setMaturityDate(original.getMaturityDate());
        clone.setPortfolioId(original.getPortfolioId());
        clone.setCurrentPrice(original.getCurrentPrice());
        clone.setImpliedVolatility(original.getImpliedVolatility());
        clone.setLastUpdated(original.getLastUpdated());
        return clone;
    }
    
    // Standard normal distribution functions
    private double normalCDF(double x) {
        return 0.5 * (1 + erf(x / Math.sqrt(2)));
    }
    
    private double normalPDF(double x) {
        return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
    }
    
    private double erf(double x) {
        // Approximation of error function
        double a1 =  0.254829592;
        double a2 = -0.284496736;
        double a3 =  1.421413741;
        double a4 = -1.453152027;
        double a5 =  1.061405429;
        double p  =  0.3275911;
        
        int sign = x < 0 ? -1 : 1;
        x = Math.abs(x);
        
        double t = 1.0 / (1.0 + p * x);
        double y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        
        return sign * y;
    }
}
