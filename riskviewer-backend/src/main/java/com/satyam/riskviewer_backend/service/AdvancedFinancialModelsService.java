package com.satyam.riskviewer_backend.service;

import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class AdvancedFinancialModelsService {

    // Black-Scholes Option Pricing
    public Map<String, Object> calculateBlackScholes(
            double spotPrice, double strikePrice, double timeToExpiry,
            double riskFreeRate, double volatility, double dividendYield) {
        
        double d1 = calculateD1(spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility, dividendYield);
        double d2 = d1 - volatility * Math.sqrt(timeToExpiry);
        
        double callPrice = spotPrice * Math.exp(-dividendYield * timeToExpiry) * normalCDF(d1)
                         - strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * normalCDF(d2);
        
        double putPrice = strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * normalCDF(-d2)
                        - spotPrice * Math.exp(-dividendYield * timeToExpiry) * normalCDF(-d1);

        Map<String, Object> greeks = calculateGreeks(spotPrice, strikePrice, timeToExpiry, 
                                                   riskFreeRate, volatility, dividendYield, d1, d2);

        Map<String, Object> result = new HashMap<>();
        result.put("callPrice", callPrice);
        result.put("putPrice", putPrice);
        result.put("greeks", greeks);
        
        return result;
    }

    private double calculateD1(double S, double K, double T, double r, double sigma, double q) {
        return (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    }

    private Map<String, Object> calculateGreeks(double S, double K, double T, double r, 
                                              double sigma, double q, double d1, double d2) {
        double sqrtT = Math.sqrt(T);
        double nd1 = normalPDF(d1);
        double Nd1 = normalCDF(d1);
        double Nd2 = normalCDF(d2);
        
        // Delta (price sensitivity)
        double callDelta = Math.exp(-q * T) * Nd1;
        
        // Gamma (delta sensitivity)
        double gamma = Math.exp(-q * T) * nd1 / (S * sigma * sqrtT);
        
        // Theta (time decay)
        double callTheta = (-S * nd1 * sigma * Math.exp(-q * T) / (2 * sqrtT)
                          - r * K * Math.exp(-r * T) * Nd2
                          + q * S * Math.exp(-q * T) * Nd1) / 365;
        
        // Vega (volatility sensitivity)
        double vega = S * Math.exp(-q * T) * nd1 * sqrtT / 100;
        
        // Rho (interest rate sensitivity)
        double callRho = K * T * Math.exp(-r * T) * Nd2 / 100;
        
        Map<String, Object> greeks = new HashMap<>();
        greeks.put("delta", callDelta);
        greeks.put("gamma", gamma);
        greeks.put("theta", callTheta);
        greeks.put("vega", vega);
        greeks.put("rho", callRho);
        
        return greeks;
    }

    // Credit Risk Assessment
    public Map<String, Object> calculateCreditRisk(double creditScore, double debtToEquity,
                                                  double currentRatio, double interestCoverage,
                                                  double industryRisk, double exposureAmount) {
        
        double pd = calculateProbabilityOfDefault(creditScore, debtToEquity, currentRatio, 
                                                interestCoverage, industryRisk);
        double lgd = calculateLossGivenDefault(debtToEquity, currentRatio);
        double ead = exposureAmount;
        
        double expectedLoss = pd * lgd * ead;
        double unexpectedLoss = Math.sqrt(pd * (1 - pd)) * lgd * ead;
        double creditVaR = normalInverse(0.99) * unexpectedLoss + expectedLoss;
        String creditRating = getCreditRating(pd);

        Map<String, Object> result = new HashMap<>();
        result.put("probabilityOfDefault", pd);
        result.put("lossGivenDefault", lgd);
        result.put("exposureAtDefault", ead);
        result.put("expectedLoss", expectedLoss);
        result.put("unexpectedLoss", unexpectedLoss);
        result.put("creditVaR", creditVaR);
        result.put("creditRating", creditRating);
        
        return result;
    }

    private double calculateProbabilityOfDefault(double creditScore, double debtToEquity,
                                               double currentRatio, double interestCoverage,
                                               double industryRisk) {
        // Logistic regression model for PD calculation
        double scoreWeight = -0.003;
        double debtWeight = 0.15;
        double liquidityWeight = -0.08;
        double coverageWeight = -0.02;
        double industryWeight = 0.05;
        
        double logit = 2.5 +
                      scoreWeight * creditScore +
                      debtWeight * debtToEquity +
                      liquidityWeight * currentRatio +
                      coverageWeight * interestCoverage +
                      industryWeight * industryRisk;
        
        return Math.max(0.001, Math.min(0.999, 1 / (1 + Math.exp(-logit))));
    }

    private double calculateLossGivenDefault(double debtToEquity, double currentRatio) {
        double baseLGD = 0.45; // 45% base loss given default
        double debtAdjustment = Math.min(0.3, debtToEquity * 0.1);
        double liquidityAdjustment = Math.max(-0.2, -currentRatio * 0.05);
        
        return Math.max(0.1, Math.min(0.9, baseLGD + debtAdjustment + liquidityAdjustment));
    }

    private String getCreditRating(double pd) {
        if (pd < 0.001) return "AAA";
        if (pd < 0.002) return "AA+";
        if (pd < 0.005) return "AA";
        if (pd < 0.01) return "AA-";
        if (pd < 0.02) return "A+";
        if (pd < 0.05) return "A";
        if (pd < 0.1) return "A-";
        if (pd < 0.15) return "BBB+";
        if (pd < 0.25) return "BBB";
        if (pd < 0.4) return "BBB-";
        if (pd < 0.6) return "BB+";
        if (pd < 0.8) return "BB";
        return "B";
    }

    // Stress Testing Scenarios
    public List<Map<String, Object>> performStressTests(double portfolioValue) {
        List<Map<String, Object>> results = new ArrayList<>();
        
        results.add(createStressTestResult("Market Crash (2008-style)",
                "Severe market downturn with 40% equity decline, 20% bond decline",
                portfolioValue, -0.32, 150, 42, 24));
        
        results.add(createStressTestResult("Interest Rate Shock",
                "300bp sudden interest rate increase affecting bonds and equity",
                portfolioValue, -0.23, 80, 25, 18));
        
        results.add(createStressTestResult("Pandemic Crisis (COVID-19 style)",
                "Global pandemic causing economic shutdown and market volatility",
                portfolioValue, -0.35, 200, 38, 12));
        
        results.add(createStressTestResult("Inflation Spike",
                "Persistent high inflation (8%+) eroding real returns",
                portfolioValue, -0.18, 60, 22, 36));
        
        results.add(createStressTestResult("Geopolitical Crisis",
                "Major geopolitical conflict affecting global markets",
                portfolioValue, -0.25, 120, 28, 15));
        
        results.add(createStressTestResult("Liquidity Crisis",
                "Severe liquidity crunch with credit markets freezing",
                portfolioValue, -0.30, 180, 35, 20));
        
        return results;
    }

    private Map<String, Object> createStressTestResult(String scenario, String description,
                                                     double portfolioValue, double percentageChange,
                                                     int var95Change, int maxDrawdown, int recovery) {
        Map<String, Object> result = new HashMap<>();
        double valueChange = portfolioValue * percentageChange;
        
        result.put("scenario", scenario);
        result.put("description", description);
        result.put("portfolioValue", portfolioValue + valueChange);
        result.put("valueChange", valueChange);
        result.put("percentageChange", percentageChange * 100);
        result.put("var95Change", var95Change);
        result.put("maxDrawdown", maxDrawdown);
        result.put("recovery", recovery);
        
        return result;
    }

    // Liquidity Risk Assessment
    public Map<String, Object> calculateLiquidityMetrics(double cashAndEquivalents,
                                                        double liquidSecurities, double totalAssets,
                                                        double shortTermLiabilities, double totalLiabilities) {
        
        double liquidityCoverageRatio = (cashAndEquivalents + liquidSecurities) / (shortTermLiabilities * 0.3);
        double netStableFundingRatio = (totalAssets - shortTermLiabilities) / totalAssets;
        double liquidityBuffer = cashAndEquivalents + liquidSecurities;
        double cashRatio = cashAndEquivalents / shortTermLiabilities;
        double quickRatio = (cashAndEquivalents + liquidSecurities) / shortTermLiabilities;
        
        String liquidityRisk = "LOW";
        if (liquidityCoverageRatio < 1.0 || quickRatio < 1.0) {
            liquidityRisk = "HIGH";
        } else if (liquidityCoverageRatio < 1.5 || quickRatio < 1.5) {
            liquidityRisk = "MEDIUM";
        }

        Map<String, Object> result = new HashMap<>();
        result.put("liquidityCoverageRatio", liquidityCoverageRatio);
        result.put("netStableFundingRatio", netStableFundingRatio);
        result.put("liquidityBuffer", liquidityBuffer);
        result.put("cashRatio", cashRatio);
        result.put("quickRatio", quickRatio);
        result.put("liquidityRisk", liquidityRisk);
        
        return result;
    }

    // Utility functions for statistical calculations
    private double normalCDF(double x) {
        return (1.0 + erf(x / Math.sqrt(2.0))) / 2.0;
    }

    private double normalPDF(double x) {
        return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
    }

    private double normalInverse(double p) {
        // Approximation of inverse normal distribution
        if (p <= 0) return Double.NEGATIVE_INFINITY;
        if (p >= 1) return Double.POSITIVE_INFINITY;
        
        // Beasley-Springer-Moro approximation
        double a0 = 2.50662823884;
        double a1 = -18.61500062529;
        double a2 = 41.39119773534;
        double a3 = -25.44106049637;
        double b1 = -8.47351093090;
        double b2 = 23.08336743743;
        double b3 = -21.06224101826;
        double b4 = 3.13082909833;
        double c0 = 0.3374754822726147;
        double c1 = 0.9761690190917186;
        double c2 = 0.1607979714918209;
        double c3 = 0.0276438810333863;
        double c4 = 0.0038405729373609;
        double c5 = 0.0003951896511919;
        double c6 = 0.0000321767881768;
        double c7 = 0.0000002888167364;
        double c8 = 0.0000003960315187;
        
        double x = p - 0.5;
        
        if (Math.abs(x) < 0.42) {
            double r = x * x;
            return x * (((a3 * r + a2) * r + a1) * r + a0) /
                   ((((b4 * r + b3) * r + b2) * r + b1) * r + 1);
        }
        
        double r = p < 0.5 ? p : 1 - p;
        r = Math.sqrt(-Math.log(r));
        
        double result = (((((((c8 * r + c7) * r + c6) * r + c5) * r + c4) * r + c3) * r + c2) * r + c1) * r + c0;
        
        return p < 0.5 ? -result : result;
    }

    private double erf(double x) {
        // Approximation of error function
        double a1 = 0.254829592;
        double a2 = -0.284496736;
        double a3 = 1.421413741;
        double a4 = -1.453152027;
        double a5 = 1.061405429;
        double p = 0.3275911;

        int sign = x >= 0 ? 1 : -1;
        x = Math.abs(x);

        double t = 1.0 / (1.0 + p * x);
        double y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return sign * y;
    }
}
