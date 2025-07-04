package com.satyam.riskviewer_backend.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.*;

import com.satyam.riskviewer_backend.model.StructuredProduct;
import com.satyam.riskviewer_backend.repository.StructuredProductRepository;
import com.satyam.riskviewer_backend.service.StructuredProductPricingService;
import com.satyam.riskviewer_backend.service.RealTimeMarketDataService;

@RestController
@RequestMapping("/api/structured-products")
@CrossOrigin(origins = "http://localhost:4200")
public class StructuredProductController {
    
    private final StructuredProductRepository structuredProductRepository;
    private final StructuredProductPricingService pricingService;
    private final RealTimeMarketDataService marketDataService;
    
    public StructuredProductController(StructuredProductRepository structuredProductRepository,
                                     StructuredProductPricingService pricingService,
                                     RealTimeMarketDataService marketDataService) {
        this.structuredProductRepository = structuredProductRepository;
        this.pricingService = pricingService;
        this.marketDataService = marketDataService;
    }
    
    @GetMapping
    public List<StructuredProduct> getAllStructuredProducts() {
        return structuredProductRepository.findAll();
    }
    
    @GetMapping("/{id}")
    public StructuredProduct getStructuredProduct(@PathVariable Long id) {
        return structuredProductRepository.findById(id).orElse(null);
    }
    
    @GetMapping("/portfolio/{portfolioId}")
    public List<StructuredProduct> getProductsByPortfolio(@PathVariable Long portfolioId) {
        return structuredProductRepository.findByPortfolioId(portfolioId);
    }
    
    @GetMapping("/type/{productType}")
    public List<StructuredProduct> getProductsByType(@PathVariable String productType) {
        return structuredProductRepository.findByProductType(productType);
    }
    
    @GetMapping("/risk-status/{status}")
    public List<StructuredProduct> getProductsByRiskStatus(@PathVariable String status) {
        return structuredProductRepository.findByRiskStatus(status);
    }
    
    @GetMapping("/{id}/pricing")
    public BigDecimal getProductPricing(@PathVariable Long id) {
        StructuredProduct product = structuredProductRepository.findById(id).orElse(null);
        if (product == null) {
            return BigDecimal.ZERO;
        }
        return pricingService.calculateBlackScholesPrice(product);
    }
    
    @GetMapping("/{id}/greeks")
    public StructuredProduct getProductGreeks(@PathVariable Long id) {
        StructuredProduct product = structuredProductRepository.findById(id).orElse(null);
        if (product != null) {
            pricingService.calculateGreeks(product);
        }
        return product;
    }
    
    @GetMapping("/{id}/stress-tests")
    public Map<String, BigDecimal> getProductStressTests(@PathVariable Long id) {
        StructuredProduct product = structuredProductRepository.findById(id).orElse(null);
        if (product == null) {
            return Map.of();
        }
        return pricingService.runStructuredProductStressTests(product);
    }
    
    @GetMapping("/high-risk")
    public List<StructuredProduct> getHighRiskProducts() {
        return structuredProductRepository.findHighGammaProducts(0.01);
    }
    
    @GetMapping("/near-maturity")
    public List<StructuredProduct> getProductsNearMaturity(@RequestParam(defaultValue = "30") int days) {
        return structuredProductRepository.findProductsNearMaturity(days);
    }
    
    @GetMapping("/near-barrier")
    public List<StructuredProduct> getProductsNearBarrier(@RequestParam(defaultValue = "1.1") double proximity) {
        return structuredProductRepository.findProductsNearBarrier(proximity);
    }
    
    @PostMapping
    public StructuredProduct createStructuredProduct(@RequestBody StructuredProduct product) {
        // Calculate initial Greeks and pricing
        pricingService.calculateGreeks(product);
        pricingService.assessRiskStatus(product);
        
        return structuredProductRepository.save(product);
    }
    
    @PutMapping("/{id}")
    public StructuredProduct updateStructuredProduct(@PathVariable Long id, @RequestBody StructuredProduct updatedProduct) {
        return structuredProductRepository.findById(id)
            .map(product -> {
                product.setCurrentPrice(updatedProduct.getCurrentPrice());
                product.setImpliedVolatility(updatedProduct.getImpliedVolatility());
                
                // Recalculate Greeks and risk status
                pricingService.calculateGreeks(product);
                pricingService.assessRiskStatus(product);
                
                return structuredProductRepository.save(product);
            })
            .orElse(null);
    }
    
    @DeleteMapping("/{id}")
    public void deleteStructuredProduct(@PathVariable Long id) {
        structuredProductRepository.deleteById(id);
    }
    
    // Real-time market data endpoints
    @GetMapping("/market-data/summary")
    public Map<String, Object> getMarketSummary() {
        return marketDataService.getMarketSummary();
    }
    
    @GetMapping("/market-data/alerts")
    public List<String> getActiveAlerts() {
        return marketDataService.getActiveAlerts();
    }
    
    @PostMapping("/market-data/clear-alerts")
    public void clearAlerts() {
        marketDataService.clearAlerts();
    }
    
    @GetMapping("/market-data/price/{symbol}")
    public Map<String, Object> getSymbolData(@PathVariable String symbol) {
        return Map.of(
            "symbol", symbol,
            "currentPrice", marketDataService.getCurrentPrice(symbol),
            "priceChange", marketDataService.getPriceChange(symbol),
            "impliedVolatility", marketDataService.getImpliedVolatility(symbol),
            "lastUpdated", marketDataService.getLastUpdated(symbol)
        );
    }
}
