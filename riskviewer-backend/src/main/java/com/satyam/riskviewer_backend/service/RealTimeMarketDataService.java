package com.satyam.riskviewer_backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.satyam.riskviewer_backend.model.Position;
import com.satyam.riskviewer_backend.model.StructuredProduct;
import com.satyam.riskviewer_backend.repository.PositionRepository;
import com.satyam.riskviewer_backend.repository.StructuredProductRepository;

@Service
public class RealTimeMarketDataService {
    
    private final PositionRepository positionRepository;
    private final StructuredProductRepository structuredProductRepository;
    private final StructuredProductPricingService pricingService;
    
    // In-memory cache for real-time prices
    private final Map<String, BigDecimal> currentPrices = new ConcurrentHashMap<>();
    private final Map<String, BigDecimal> priceChanges = new ConcurrentHashMap<>();
    private final Map<String, LocalDateTime> lastUpdated = new ConcurrentHashMap<>();
    
    // Market volatility cache
    private final Map<String, BigDecimal> impliedVolatilities = new ConcurrentHashMap<>();
    
    // Risk alerts
    private final List<String> activeAlerts = new ArrayList<>();
    
    public RealTimeMarketDataService(PositionRepository positionRepository, 
                                   StructuredProductRepository structuredProductRepository,
                                   StructuredProductPricingService pricingService) {
        this.positionRepository = positionRepository;
        this.structuredProductRepository = structuredProductRepository;
        this.pricingService = pricingService;
        
        // Initialize with mock data
        initializeMockMarketData();
    }
    
    /**
     * Simulate real-time market data updates every 30 seconds
     * In production, this would connect to Bloomberg/Reuters/IEX feeds
     */
    @Scheduled(fixedRate = 30000) // Every 30 seconds
    public void updateMarketData() {
        Random random = new Random();
        
        // Simulate market movements for major symbols
        String[] symbols = {"AAPL", "MSFT", "GOOGL", "TSLA", "NVDA", "AMZN", "SPY", "TLT", "VXX", "BITO"};
        
        for (String symbol : symbols) {
            BigDecimal currentPrice = currentPrices.get(symbol);
            if (currentPrice != null) {
                // Generate realistic price movement (-2% to +2%)
                double changePercent = (random.nextGaussian() * 0.005); // 0.5% std dev
                changePercent = Math.max(-0.02, Math.min(0.02, changePercent)); // Cap at ±2%
                
                BigDecimal newPrice = currentPrice.multiply(BigDecimal.valueOf(1 + changePercent))
                    .setScale(2, RoundingMode.HALF_UP);
                
                BigDecimal priceChange = newPrice.subtract(currentPrice);
                
                currentPrices.put(symbol, newPrice);
                priceChanges.put(symbol, priceChange);
                lastUpdated.put(symbol, LocalDateTime.now());
                
                // Update volatility simulation
                updateImpliedVolatility(symbol, Math.abs(changePercent));
                
                // Check for risk alerts
                checkRiskAlerts(symbol, newPrice, priceChange);
            }
        }
        
        // Update positions and structured products with new prices
        updatePositionPrices();
        updateStructuredProductPrices();
    }
    
    /**
     * Update position values with real-time prices
     */
    private void updatePositionPrices() {
        List<Position> allPositions = positionRepository.findAll();
        
        for (Position position : allPositions) {
            BigDecimal newPrice = currentPrices.get(position.getSymbol());
            if (newPrice != null) {
                // In a real system, you'd update a market_price field
                // For demo, we'll just track the current market values
                BigDecimal marketValue = newPrice.multiply(position.getQuantity());
                BigDecimal purchaseValue = position.getPurchasePrice().multiply(position.getQuantity());
                BigDecimal pnl = marketValue.subtract(purchaseValue);
                
                // Could store this in a separate PnL tracking table
                System.out.println(String.format("Position %s: Market Value: $%s, P&L: $%s", 
                    position.getSymbol(), marketValue, pnl));
            }
        }
    }
    
    /**
     * Update structured products with new market data
     */
    private void updateStructuredProductPrices() {
        List<StructuredProduct> products = structuredProductRepository.findAll();
        
        for (StructuredProduct product : products) {
            BigDecimal newPrice = currentPrices.get(product.getUnderlyingAsset());
            BigDecimal newVol = impliedVolatilities.get(product.getUnderlyingAsset());
            
            if (newPrice != null && newVol != null) {
                product.setCurrentPrice(newPrice);
                product.setImpliedVolatility(newVol);
                product.setLastUpdated(LocalDateTime.now());
                
                // Recalculate Greeks and pricing
                pricingService.calculateGreeks(product);
                pricingService.assessRiskStatus(product);
                
                // Save updated product
                structuredProductRepository.save(product);
                
                // Check for barrier proximity alerts
                checkBarrierAlerts(product);
            }
        }
    }
    
    /**
     * Initialize mock market data
     */
    private void initializeMockMarketData() {
        // Initialize with realistic starting prices
        currentPrices.put("AAPL", new BigDecimal("145.50"));
        currentPrices.put("MSFT", new BigDecimal("280.00"));
        currentPrices.put("GOOGL", new BigDecimal("125.30"));
        currentPrices.put("TSLA", new BigDecimal("240.00"));
        currentPrices.put("NVDA", new BigDecimal("450.00"));
        currentPrices.put("AMZN", new BigDecimal("330.00"));
        currentPrices.put("SPY", new BigDecimal("420.00"));
        currentPrices.put("TLT", new BigDecimal("95.20"));
        currentPrices.put("VXX", new BigDecimal("12.50"));
        currentPrices.put("BITO", new BigDecimal("28.50"));
        
        // Initialize volatilities
        impliedVolatilities.put("AAPL", new BigDecimal("0.25"));
        impliedVolatilities.put("MSFT", new BigDecimal("0.22"));
        impliedVolatilities.put("GOOGL", new BigDecimal("0.28"));
        impliedVolatilities.put("TSLA", new BigDecimal("0.45"));
        impliedVolatilities.put("NVDA", new BigDecimal("0.35"));
        impliedVolatilities.put("AMZN", new BigDecimal("0.30"));
        impliedVolatilities.put("SPY", new BigDecimal("0.18"));
        impliedVolatilities.put("TLT", new BigDecimal("0.08"));
        impliedVolatilities.put("VXX", new BigDecimal("0.80"));
        impliedVolatilities.put("BITO", new BigDecimal("0.60"));
        
        // Initialize timestamps
        LocalDateTime now = LocalDateTime.now();
        for (String symbol : currentPrices.keySet()) {
            lastUpdated.put(symbol, now);
            priceChanges.put(symbol, BigDecimal.ZERO);
        }
    }
    
    /**
     * Update implied volatility based on price movements
     */
    private void updateImpliedVolatility(String symbol, double priceChangePercent) {
        BigDecimal currentVol = impliedVolatilities.get(symbol);
        if (currentVol != null) {
            // Volatility increases with large price movements
            double volAdjustment = priceChangePercent * 2; // Amplify vol response
            BigDecimal newVol = currentVol.multiply(BigDecimal.valueOf(1 + volAdjustment))
                .setScale(4, RoundingMode.HALF_UP);
            
            // Keep volatility within reasonable bounds
            newVol = newVol.max(BigDecimal.valueOf(0.05)); // Min 5%
            newVol = newVol.min(BigDecimal.valueOf(2.00)); // Max 200%
            
            impliedVolatilities.put(symbol, newVol);
        }
    }
    
    /**
     * Check for risk alerts on price movements
     */
    private void checkRiskAlerts(String symbol, BigDecimal newPrice, BigDecimal priceChange) {
        double changePercent = priceChange.divide(newPrice.subtract(priceChange), 4, RoundingMode.HALF_UP).doubleValue() * 100;
        
        // Alert on large moves
        if (Math.abs(changePercent) > 3.0) {
            String alert = String.format("ALERT: %s moved %.2f%% to $%.2f", 
                symbol, changePercent, newPrice);
            activeAlerts.add(alert);
            System.out.println(alert);
        }
        
        // Alert on volatility spikes
        BigDecimal vol = impliedVolatilities.get(symbol);
        if (vol != null && vol.compareTo(BigDecimal.valueOf(0.50)) > 0) {
            String alert = String.format("VOLATILITY ALERT: %s implied vol at %.1f%%", 
                symbol, vol.doubleValue() * 100);
            activeAlerts.add(alert);
            System.out.println(alert);
        }
    }
    
    /**
     * Check for barrier proximity alerts on structured products
     */
    private void checkBarrierAlerts(StructuredProduct product) {
        if (product.getBarrierLevel() != null) {
            double barrierProximity = product.getCurrentPrice().divide(product.getBarrierLevel(), 4, RoundingMode.HALF_UP).doubleValue();
            
            if (barrierProximity < 1.05) { // Within 5% of barrier
                String alert = String.format("BARRIER ALERT: Product %s at %.1f%% of barrier level", 
                    product.getProductCode(), barrierProximity * 100);
                activeAlerts.add(alert);
                System.out.println(alert);
            }
        }
    }
    
    // Public API methods
    public BigDecimal getCurrentPrice(String symbol) {
        return currentPrices.get(symbol);
    }
    
    public BigDecimal getPriceChange(String symbol) {
        return priceChanges.get(symbol);
    }
    
    public BigDecimal getImpliedVolatility(String symbol) {
        return impliedVolatilities.get(symbol);
    }
    
    public LocalDateTime getLastUpdated(String symbol) {
        return lastUpdated.get(symbol);
    }
    
    public List<String> getActiveAlerts() {
        return new ArrayList<>(activeAlerts);
    }
    
    public void clearAlerts() {
        activeAlerts.clear();
    }
    
    public Map<String, Object> getMarketSummary() {
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalSymbols", currentPrices.size());
        summary.put("activeAlerts", activeAlerts.size());
        summary.put("lastUpdate", LocalDateTime.now());
        
        // Calculate market statistics
        double avgVolatility = impliedVolatilities.values().stream()
            .mapToDouble(BigDecimal::doubleValue)
            .average()
            .orElse(0.0);
        summary.put("averageVolatility", avgVolatility);
        
        long positiveMovers = priceChanges.values().stream()
            .filter(change -> change.compareTo(BigDecimal.ZERO) > 0)
            .count();
        summary.put("positiveMovers", positiveMovers);
        
        return summary;
    }
}
