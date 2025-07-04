package com.satyam.riskviewer_backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.satyam.riskviewer_backend.repository.PositionRepository;
import com.satyam.riskviewer_backend.model.Position;

@Service
public class RiskAnalyticsService {
    
    private final PositionRepository positionRepository;
    private final PerformanceMonitoringService performanceMonitoringService;

    public RiskAnalyticsService(PositionRepository positionRepository,
                               PerformanceMonitoringService performanceMonitoringService) {
        this.positionRepository = positionRepository;
        this.performanceMonitoringService = performanceMonitoringService;
    }

    /**
     * Calculate portfolio-level Value at Risk using Historical Simulation
     */
    public BigDecimal calculatePortfolioVaR(Long portfolioId, double confidenceLevel) {
        long startTime = System.currentTimeMillis();
        
        try {
            List<Position> positions = positionRepository.findByPortfolioId(portfolioId);
            
            if (positions.isEmpty()) {
                return BigDecimal.ZERO;
            }
            
            // For demonstration, we'll use a simplified VaR calculation
            // In reality, you'd need historical price data
            BigDecimal portfolioValue = calculatePortfolioValue(portfolioId);
            
            // Simplified VaR: assume 2% daily volatility for equity-heavy portfolios
            double volatility = calculatePortfolioVolatility(positions);
            double zScore = getZScoreForConfidence(confidenceLevel); // e.g., 1.645 for 95%
            
            BigDecimal var = portfolioValue
                .multiply(BigDecimal.valueOf(volatility))
                .multiply(BigDecimal.valueOf(zScore));
            
            long executionTime = System.currentTimeMillis() - startTime;
            performanceMonitoringService.recordRiskCalculation("VaR", executionTime);
                
            return var.setScale(2, RoundingMode.HALF_UP);
        } catch (Exception e) {
            long executionTime = System.currentTimeMillis() - startTime;
            performanceMonitoringService.recordError("VaR_calculation", e.getClass().getSimpleName());
            throw e;
        }
    }

    /**
     * Calculate total portfolio value
     */
    public BigDecimal calculatePortfolioValue(Long portfolioId) {
        List<Position> positions = positionRepository.findByPortfolioId(portfolioId);
        
        return positions.stream()
            .map(this::calculatePositionValue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    /**
     * Calculate individual position value (quantity * purchase price)
     */
    public BigDecimal calculatePositionValue(Position position) {
        return position.getQuantity().multiply(position.getPurchasePrice());
    }
    
    /**
     * Calculate portfolio concentration risk (largest position as % of total)
     */
    public BigDecimal calculateConcentrationRisk(Long portfolioId) {
        List<Position> positions = positionRepository.findByPortfolioId(portfolioId);
        
        if (positions.isEmpty()) {
            return BigDecimal.ZERO;
        }
        
        BigDecimal totalValue = calculatePortfolioValue(portfolioId);
        BigDecimal largestPosition = positions.stream()
            .map(this::calculatePositionValue)
            .max(BigDecimal::compareTo)
            .orElse(BigDecimal.ZERO);
            
        if (totalValue.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        
        return largestPosition
            .divide(totalValue, 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100));
    }
    
    /**
     * Calculate asset allocation breakdown
     */
    public Map<String, BigDecimal> calculateAssetAllocation(Long portfolioId) {
        List<Position> positions = positionRepository.findByPortfolioId(portfolioId);
        BigDecimal totalValue = calculatePortfolioValue(portfolioId);
        
        if (totalValue.compareTo(BigDecimal.ZERO) == 0) {
            return new HashMap<>();
        }
        
        return positions.stream()
            .collect(Collectors.groupingBy(
                Position::getType,
                Collectors.reducing(
                    BigDecimal.ZERO,
                    this::calculatePositionValue,
                    BigDecimal::add
                )
            ))
            .entrySet()
            .stream()
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                entry -> entry.getValue()
                    .divide(totalValue, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
            ));
    }
    
    /**
     * Calculate portfolio volatility based on asset mix
     */
    private double calculatePortfolioVolatility(List<Position> positions) {
        Map<String, Double> assetVolatilities = Map.of(
            "Equity", 0.25,      // 25% annual volatility
            "Bond", 0.08,        // 8% annual volatility  
            "ETF", 0.18,         // 18% annual volatility
            "Derivative", 0.45   // 45% annual volatility
        );
        
        BigDecimal totalValue = positions.stream()
            .map(this::calculatePositionValue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        if (totalValue.compareTo(BigDecimal.ZERO) == 0) {
            return 0.0;
        }
        
        double weightedVolatility = 0.0;
        
        for (Position position : positions) {
            BigDecimal positionValue = calculatePositionValue(position);
            double weight = positionValue.divide(totalValue, 6, RoundingMode.HALF_UP).doubleValue();
            double assetVol = assetVolatilities.getOrDefault(position.getType(), 0.20);
            weightedVolatility += weight * assetVol;
        }
        
        // Convert annual to daily volatility (sqrt(252) trading days)
        return weightedVolatility / Math.sqrt(252);
    }
    
    /**
     * Get Z-score for confidence level
     */
    private double getZScoreForConfidence(double confidence) {
        Map<Double, Double> zScores = Map.of(
            0.90, 1.282,
            0.95, 1.645,
            0.99, 2.326
        );
        return zScores.getOrDefault(confidence, 1.645);
    }
    
    /**
     * Calculate Sharpe Ratio (simplified)
     */
    public BigDecimal calculateSharpeRatio(Long portfolioId) {
        // Simplified calculation assuming:
        // - Risk-free rate of 3%
        // - Expected return based on asset mix
        
        List<Position> positions = positionRepository.findByPortfolioId(portfolioId);
        double portfolioReturn = calculateExpectedReturn(positions);
        double riskFreeRate = 0.03;
        double volatility = calculatePortfolioVolatility(positions) * Math.sqrt(252); // Annualized
        
        if (volatility == 0) {
            return BigDecimal.ZERO;
        }
        
        double sharpe = (portfolioReturn - riskFreeRate) / volatility;
        return BigDecimal.valueOf(sharpe).setScale(3, RoundingMode.HALF_UP);
    }
    
    /**
     * Calculate expected return based on asset allocation
     */
    private double calculateExpectedReturn(List<Position> positions) {
        Map<String, Double> expectedReturns = Map.of(
            "Equity", 0.10,      // 10% expected annual return
            "Bond", 0.04,        // 4% expected annual return
            "ETF", 0.08,         // 8% expected annual return
            "Derivative", 0.15   // 15% expected annual return (higher risk)
        );
        
        BigDecimal totalValue = positions.stream()
            .map(this::calculatePositionValue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        if (totalValue.compareTo(BigDecimal.ZERO) == 0) {
            return 0.0;
        }
        
        double weightedReturn = 0.0;
        
        for (Position position : positions) {
            BigDecimal positionValue = calculatePositionValue(position);
            double weight = positionValue.divide(totalValue, 6, RoundingMode.HALF_UP).doubleValue();
            double assetReturn = expectedReturns.getOrDefault(position.getType(), 0.08);
            weightedReturn += weight * assetReturn;
        }
        
        return weightedReturn;
    }

    /**
     * Calculate Value at Risk using Monte Carlo Simulation
     * This is more sophisticated than parametric VaR
     */
    public BigDecimal calculateMonteCarloVaR(Long portfolioId, double confidenceLevel, int simulations) {
        List<Position> positions = positionRepository.findByPortfolioId(portfolioId);
        
        if (positions.isEmpty()) {
            return BigDecimal.ZERO;
        }
        
        BigDecimal portfolioValue = calculatePortfolioValue(portfolioId);
        Random random = new Random(12345); // Fixed seed for reproducibility
        
        List<Double> portfolioReturns = new ArrayList<>();
        
        // Run Monte Carlo simulations
        for (int i = 0; i < simulations; i++) {
            double portfolioReturn = simulatePortfolioReturn(positions, random);
            portfolioReturns.add(portfolioReturn);
        }
        
        // Sort returns and find VaR at confidence level
        portfolioReturns.sort(Double::compareTo);
        int varIndex = (int) Math.floor((1 - confidenceLevel) * simulations);
        double varReturn = portfolioReturns.get(Math.max(0, varIndex));
        
        // Convert return to dollar amount
        BigDecimal var = portfolioValue.multiply(BigDecimal.valueOf(Math.abs(varReturn)));
        return var.setScale(2, RoundingMode.HALF_UP);
    }
    
    /**
     * Simulate a single portfolio return using correlated asset returns
     */
    private double simulatePortfolioReturn(List<Position> positions, Random random) {
        BigDecimal totalValue = positions.stream()
            .map(this::calculatePositionValue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        if (totalValue.compareTo(BigDecimal.ZERO) == 0) {
            return 0.0;
        }
        
        double portfolioReturn = 0.0;
        
        for (Position position : positions) {
            // Generate correlated random return for each asset
            double assetReturn = generateAssetReturn(position.getType(), random);
            double weight = calculatePositionValue(position).divide(totalValue, 6, RoundingMode.HALF_UP).doubleValue();
            portfolioReturn += weight * assetReturn;
        }
        
        return portfolioReturn;
    }
    
    /**
     * Generate realistic asset returns with proper volatility
     */
    private double generateAssetReturn(String assetType, Random random) {
        Map<String, Double> expectedReturns = Map.of(
            "Equity", 0.10,      // 10% annual expected return
            "Bond", 0.04,        // 4% annual expected return
            "ETF", 0.08,         // 8% annual expected return
            "Derivative", 0.15   // 15% annual expected return
        );
        
        Map<String, Double> volatilities = Map.of(
            "Equity", 0.25,      // 25% annual volatility
            "Bond", 0.08,        // 8% annual volatility
            "ETF", 0.18,         // 18% annual volatility
            "Derivative", 0.45   // 45% annual volatility
        );
        
        double expectedReturn = expectedReturns.getOrDefault(assetType, 0.08);
        double volatility = volatilities.getOrDefault(assetType, 0.20);
        
        // Convert to daily return and volatility
        double dailyReturn = expectedReturn / 252.0;
        double dailyVolatility = volatility / Math.sqrt(252.0);
        
        // Generate normal random return
        double normalRandom = random.nextGaussian();
        return dailyReturn + (dailyVolatility * normalRandom);
    }
    
    /**
     * Stress Test: Calculate portfolio loss under extreme scenarios
     */
    public Map<String, BigDecimal> runStressTests(Long portfolioId) {
        List<Position> positions = positionRepository.findByPortfolioId(portfolioId);
        BigDecimal portfolioValue = calculatePortfolioValue(portfolioId);
        
        Map<String, BigDecimal> stressResults = new HashMap<>();
        
        if (portfolioValue.compareTo(BigDecimal.ZERO) == 0) {
            return stressResults;
        }
        
        // Scenario 1: Market Crash (2008-style)
        BigDecimal marketCrashLoss = calculateScenarioLoss(positions, Map.of(
            "Equity", -0.40,     // 40% equity drop
            "Bond", -0.05,       // 5% bond drop
            "ETF", -0.35,        // 35% ETF drop
            "Derivative", -0.60  // 60% derivative drop
        ));
        stressResults.put("Market Crash", marketCrashLoss);
        
        // Scenario 2: Interest Rate Shock
        BigDecimal interestRateShock = calculateScenarioLoss(positions, Map.of(
            "Equity", -0.15,     // 15% equity drop
            "Bond", -0.20,       // 20% bond drop (duration risk)
            "ETF", -0.12,        // 12% ETF drop
            "Derivative", -0.25  // 25% derivative drop
        ));
        stressResults.put("Interest Rate Shock", interestRateShock);
        
        // Scenario 3: Black Swan Event
        BigDecimal blackSwanLoss = calculateScenarioLoss(positions, Map.of(
            "Equity", -0.50,     // 50% equity drop
            "Bond", 0.10,        // 10% bond gain (flight to quality)
            "ETF", -0.45,        // 45% ETF drop
            "Derivative", -0.80  // 80% derivative drop
        ));
        stressResults.put("Black Swan", blackSwanLoss);
        
        // Scenario 4: Inflation Spike
        BigDecimal inflationSpike = calculateScenarioLoss(positions, Map.of(
            "Equity", -0.20,     // 20% equity drop
            "Bond", -0.25,       // 25% bond drop
            "ETF", -0.18,        // 18% ETF drop
            "Derivative", -0.30  // 30% derivative drop
        ));
        stressResults.put("Inflation Spike", inflationSpike);
        
        return stressResults;
    }
    
    /**
     * Calculate portfolio loss under a specific scenario
     */
    private BigDecimal calculateScenarioLoss(List<Position> positions, Map<String, Double> scenarioShocks) {
        BigDecimal totalLoss = BigDecimal.ZERO;
        
        for (Position position : positions) {
            BigDecimal positionValue = calculatePositionValue(position);
            Double shock = scenarioShocks.getOrDefault(position.getType(), 0.0);
            BigDecimal positionLoss = positionValue.multiply(BigDecimal.valueOf(Math.abs(shock)));
            
            if (shock < 0) { // Only count negative shocks as losses
                totalLoss = totalLoss.add(positionLoss);
            }
        }
        
        return totalLoss.setScale(2, RoundingMode.HALF_UP);
    }
    
    /**
     * Calculate Expected Shortfall (Conditional VaR)
     * This measures the expected loss beyond VaR
     */
    public BigDecimal calculateExpectedShortfall(Long portfolioId, double confidenceLevel) {
        List<Position> positions = positionRepository.findByPortfolioId(portfolioId);
        
        if (positions.isEmpty()) {
            return BigDecimal.ZERO;
        }
        
        BigDecimal portfolioValue = calculatePortfolioValue(portfolioId);
        Random random = new Random(12345);
        
        List<Double> portfolioReturns = new ArrayList<>();
        
        // Run simulations
        for (int i = 0; i < 10000; i++) {
            double portfolioReturn = simulatePortfolioReturn(positions, random);
            portfolioReturns.add(portfolioReturn);
        }
        
        // Sort returns and calculate Expected Shortfall
        portfolioReturns.sort(Double::compareTo);
        int varIndex = (int) Math.floor((1 - confidenceLevel) * portfolioReturns.size());
        
        // Average of losses beyond VaR
        double expectedShortfall = portfolioReturns.subList(0, varIndex)
            .stream()
            .mapToDouble(Double::doubleValue)
            .average()
            .orElse(0.0);
        
        BigDecimal es = portfolioValue.multiply(BigDecimal.valueOf(Math.abs(expectedShortfall)));
        return es.setScale(2, RoundingMode.HALF_UP);
    }
    
    /**
     * Calculate Maximum Drawdown simulation
     */
    public BigDecimal calculateMaxDrawdown(Long portfolioId, int days) {
        List<Position> positions = positionRepository.findByPortfolioId(portfolioId);
        BigDecimal initialValue = calculatePortfolioValue(portfolioId);
        
        if (initialValue.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        
        Random random = new Random(12345);
        BigDecimal currentValue = initialValue;
        BigDecimal peakValue = initialValue;
        BigDecimal maxDrawdown = BigDecimal.ZERO;
        
        // Simulate daily returns
        for (int day = 0; day < days; day++) {
            double dailyReturn = simulatePortfolioReturn(positions, random);
            currentValue = currentValue.multiply(BigDecimal.valueOf(1 + dailyReturn));
            
            // Track peak value
            if (currentValue.compareTo(peakValue) > 0) {
                peakValue = currentValue;
            }
            
            // Calculate drawdown from peak
            BigDecimal drawdown = peakValue.subtract(currentValue);
            if (drawdown.compareTo(maxDrawdown) > 0) {
                maxDrawdown = drawdown;
            }
        }
        
        return maxDrawdown.setScale(2, RoundingMode.HALF_UP);
    }
    
    /**
     * Portfolio Beta calculation (systematic risk)
     */
    public BigDecimal calculatePortfolioBeta(Long portfolioId) {
        List<Position> positions = positionRepository.findByPortfolioId(portfolioId);
        
        // Simplified beta calculation based on asset mix
        Map<String, Double> assetBetas = Map.of(
            "Equity", 1.2,       // High beta for individual stocks
            "Bond", 0.1,         // Low beta for bonds
            "ETF", 1.0,          // Market beta for ETFs
            "Derivative", 2.0    // High beta for derivatives
        );
        
        BigDecimal totalValue = calculatePortfolioValue(portfolioId);
        
        if (totalValue.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        
        double weightedBeta = 0.0;
        
        for (Position position : positions) {
            BigDecimal positionValue = calculatePositionValue(position);
            double weight = positionValue.divide(totalValue, 6, RoundingMode.HALF_UP).doubleValue();
            double assetBeta = assetBetas.getOrDefault(position.getType(), 1.0);
            weightedBeta += weight * assetBeta;
        }
        
        return BigDecimal.valueOf(weightedBeta).setScale(3, RoundingMode.HALF_UP);
    }
    
}
