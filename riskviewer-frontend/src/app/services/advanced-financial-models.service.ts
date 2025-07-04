import { Injectable } from '@angular/core';

export interface BlackScholesResult {
  callPrice: number;
  putPrice: number;
  greeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
  };
}

export interface CreditRiskMetrics {
  probabilityOfDefault: number;
  lossGivenDefault: number;
  exposureAtDefault: number;
  expectedLoss: number;
  unexpectedLoss: number;
  creditVaR: number;
  creditRating: string;
}

export interface StressTestResult {
  scenario: string;
  description: string;
  portfolioValue: number;
  valueChange: number;
  percentageChange: number;
  var95Change: number;
  maxDrawdown: number;
  recovery: number;
}

export interface LiquidityMetrics {
  liquidityCoverageRatio: number;
  netStableFundingRatio: number;
  liquidityBuffer: number;
  cashRatio: number;
  quickRatio: number;
  liquidityRisk: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdvancedFinancialModelsService {

  constructor() { }

  // Black-Scholes Option Pricing Model
  calculateBlackScholes(
    spotPrice: number,
    strikePrice: number,
    timeToExpiry: number,
    riskFreeRate: number,
    volatility: number,
    dividendYield: number = 0
  ): BlackScholesResult {
    
    const d1 = this.calculateD1(spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility, dividendYield);
    const d2 = d1 - volatility * Math.sqrt(timeToExpiry);
    
    const callPrice = spotPrice * Math.exp(-dividendYield * timeToExpiry) * this.normalCDF(d1) 
                    - strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * this.normalCDF(d2);
    
    const putPrice = strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * this.normalCDF(-d2) 
                   - spotPrice * Math.exp(-dividendYield * timeToExpiry) * this.normalCDF(-d1);

    // Calculate Greeks
    const greeks = this.calculateGreeks(spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility, dividendYield, d1, d2);

    return {
      callPrice,
      putPrice,
      greeks
    };
  }

  private calculateD1(S: number, K: number, T: number, r: number, sigma: number, q: number): number {
    return (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  }

  private calculateGreeks(S: number, K: number, T: number, r: number, sigma: number, q: number, d1: number, d2: number) {
    const sqrtT = Math.sqrt(T);
    const nd1 = this.normalPDF(d1);
    const Nd1 = this.normalCDF(d1);
    const Nd2 = this.normalCDF(d2);
    
    // Delta (price sensitivity)
    const callDelta = Math.exp(-q * T) * Nd1;
    const putDelta = -Math.exp(-q * T) * this.normalCDF(-d1);
    
    // Gamma (delta sensitivity)
    const gamma = Math.exp(-q * T) * nd1 / (S * sigma * sqrtT);
    
    // Theta (time decay)
    const callTheta = (-S * nd1 * sigma * Math.exp(-q * T) / (2 * sqrtT) 
                     - r * K * Math.exp(-r * T) * Nd2 
                     + q * S * Math.exp(-q * T) * Nd1) / 365;
    
    // Vega (volatility sensitivity)
    const vega = S * Math.exp(-q * T) * nd1 * sqrtT / 100;
    
    // Rho (interest rate sensitivity)
    const callRho = K * T * Math.exp(-r * T) * Nd2 / 100;
    
    return {
      delta: callDelta,
      gamma: gamma,
      theta: callTheta,
      vega: vega,
      rho: callRho
    };
  }

  // Credit Risk Assessment
  calculateCreditRisk(
    creditScore: number,
    debtToEquity: number,
    currentRatio: number,
    interestCoverage: number,
    industryRisk: number,
    exposureAmount: number
  ): CreditRiskMetrics {
    
    // Simplified credit risk model based on financial ratios
    let pd = this.calculateProbabilityOfDefault(creditScore, debtToEquity, currentRatio, interestCoverage, industryRisk);
    let lgd = this.calculateLossGivenDefault(debtToEquity, currentRatio);
    let ead = exposureAmount;
    
    const expectedLoss = pd * lgd * ead;
    const unexpectedLoss = Math.sqrt(pd * (1 - pd)) * lgd * ead;
    const creditVaR = this.normalInverse(0.99) * unexpectedLoss + expectedLoss;
    const creditRating = this.getCreditRating(pd);

    return {
      probabilityOfDefault: pd,
      lossGivenDefault: lgd,
      exposureAtDefault: ead,
      expectedLoss,
      unexpectedLoss,
      creditVaR,
      creditRating
    };
  }

  private calculateProbabilityOfDefault(creditScore: number, debtToEquity: number, currentRatio: number, interestCoverage: number, industryRisk: number): number {
    // Logistic regression model for PD calculation
    const scoreWeight = -0.003;
    const debtWeight = 0.15;
    const liquidityWeight = -0.08;
    const coverageWeight = -0.02;
    const industryWeight = 0.05;
    
    const logit = 2.5 + 
                  scoreWeight * creditScore + 
                  debtWeight * debtToEquity + 
                  liquidityWeight * currentRatio + 
                  coverageWeight * interestCoverage + 
                  industryWeight * industryRisk;
    
    return Math.max(0.001, Math.min(0.999, 1 / (1 + Math.exp(-logit))));
  }

  private calculateLossGivenDefault(debtToEquity: number, currentRatio: number): number {
    // LGD based on collateral and seniority
    const baseLGD = 0.45; // 45% base loss given default
    const debtAdjustment = Math.min(0.3, debtToEquity * 0.1);
    const liquidityAdjustment = Math.max(-0.2, -currentRatio * 0.05);
    
    return Math.max(0.1, Math.min(0.9, baseLGD + debtAdjustment + liquidityAdjustment));
  }

  private getCreditRating(pd: number): string {
    if (pd < 0.001) return 'AAA';
    if (pd < 0.002) return 'AA+';
    if (pd < 0.005) return 'AA';
    if (pd < 0.01) return 'AA-';
    if (pd < 0.02) return 'A+';
    if (pd < 0.05) return 'A';
    if (pd < 0.1) return 'A-';
    if (pd < 0.15) return 'BBB+';
    if (pd < 0.25) return 'BBB';
    if (pd < 0.4) return 'BBB-';
    if (pd < 0.6) return 'BB+';
    if (pd < 0.8) return 'BB';
    return 'B';
  }

  // Stress Testing Scenarios
  performStressTests(portfolioValue: number, positions: any[]): StressTestResult[] {
    return [
      this.marketCrashScenario(portfolioValue, positions),
      this.interestRateShockScenario(portfolioValue, positions),
      this.covidPandemicScenario(portfolioValue, positions),
      this.inflationSpike(portfolioValue, positions),
      this.geopoliticalCrisis(portfolioValue, positions),
      this.liquidityCrisis(portfolioValue, positions),
      this.sectorConcentrationRisk(portfolioValue, positions)
    ];
  }

  private marketCrashScenario(portfolioValue: number, positions: any[]): StressTestResult {
    // 2008-style market crash: -40% equity, -20% bonds, +50% vol
    const equityWeight = 0.7; // Assume 70% equity
    const bondWeight = 0.3;   // Assume 30% bonds
    
    const valueChange = portfolioValue * (equityWeight * -0.40 + bondWeight * -0.20);
    const newValue = portfolioValue + valueChange;
    
    return {
      scenario: 'Market Crash (2008-style)',
      description: 'Severe market downturn with 40% equity decline, 20% bond decline, volatility spike',
      portfolioValue: newValue,
      valueChange,
      percentageChange: (valueChange / portfolioValue) * 100,
      var95Change: 150, // VaR increases by 150%
      maxDrawdown: 42,
      recovery: 24 // months to recover
    };
  }

  private interestRateShockScenario(portfolioValue: number, positions: any[]): StressTestResult {
    // Sudden 300bp rate increase
    const bondWeight = 0.3;
    const duration = 7; // Average portfolio duration
    const rateShock = 0.03; // 3% rate increase
    
    const bondImpact = -bondWeight * duration * rateShock;
    const equityImpact = -0.15; // Equity down 15% due to higher discount rates
    
    const valueChange = portfolioValue * (bondImpact + equityImpact * 0.7);
    
    return {
      scenario: 'Interest Rate Shock',
      description: '300bp sudden interest rate increase affecting bonds and equity valuations',
      portfolioValue: portfolioValue + valueChange,
      valueChange,
      percentageChange: (valueChange / portfolioValue) * 100,
      var95Change: 80,
      maxDrawdown: 25,
      recovery: 18
    };
  }

  private covidPandemicScenario(portfolioValue: number, positions: any[]): StressTestResult {
    // COVID-19 style scenario
    const valueChange = portfolioValue * -0.35; // 35% portfolio decline
    
    return {
      scenario: 'Pandemic Crisis (COVID-19 style)',
      description: 'Global pandemic causing economic shutdown and market volatility',
      portfolioValue: portfolioValue + valueChange,
      valueChange,
      percentageChange: -35,
      var95Change: 200,
      maxDrawdown: 38,
      recovery: 12
    };
  }

  private inflationSpike(portfolioValue: number, positions: any[]): StressTestResult {
    // High inflation scenario
    const valueChange = portfolioValue * -0.18; // Real value erosion
    
    return {
      scenario: 'Inflation Spike',
      description: 'Persistent high inflation (8%+) eroding real returns',
      portfolioValue: portfolioValue + valueChange,
      valueChange,
      percentageChange: -18,
      var95Change: 60,
      maxDrawdown: 22,
      recovery: 36
    };
  }

  private geopoliticalCrisis(portfolioValue: number, positions: any[]): StressTestResult {
    const valueChange = portfolioValue * -0.25;
    
    return {
      scenario: 'Geopolitical Crisis',
      description: 'Major geopolitical conflict affecting global markets',
      portfolioValue: portfolioValue + valueChange,
      valueChange,
      percentageChange: -25,
      var95Change: 120,
      maxDrawdown: 28,
      recovery: 15
    };
  }

  private liquidityCrisis(portfolioValue: number, positions: any[]): StressTestResult {
    const valueChange = portfolioValue * -0.30;
    
    return {
      scenario: 'Liquidity Crisis',
      description: 'Severe liquidity crunch with credit markets freezing',
      portfolioValue: portfolioValue + valueChange,
      valueChange,
      percentageChange: -30,
      var95Change: 180,
      maxDrawdown: 35,
      recovery: 20
    };
  }

  private sectorConcentrationRisk(portfolioValue: number, positions: any[]): StressTestResult {
    const valueChange = portfolioValue * -0.22;
    
    return {
      scenario: 'Sector Concentration Risk',
      description: 'Major sector collapse affecting concentrated positions',
      portfolioValue: portfolioValue + valueChange,
      valueChange,
      percentageChange: -22,
      var95Change: 90,
      maxDrawdown: 26,
      recovery: 18
    };
  }

  // Liquidity Risk Assessment
  calculateLiquidityMetrics(
    cashAndEquivalents: number,
    liquidSecurities: number,
    totalAssets: number,
    shortTermLiabilities: number,
    totalLiabilities: number,
    deposits: number
  ): LiquidityMetrics {
    
    const liquidityCoverageRatio = (cashAndEquivalents + liquidSecurities) / (shortTermLiabilities * 0.3);
    const netStableFundingRatio = (totalAssets - shortTermLiabilities) / totalAssets;
    const liquidityBuffer = cashAndEquivalents + liquidSecurities;
    const cashRatio = cashAndEquivalents / shortTermLiabilities;
    const quickRatio = (cashAndEquivalents + liquidSecurities) / shortTermLiabilities;
    
    let liquidityRisk = 'LOW';
    if (liquidityCoverageRatio < 1.0 || quickRatio < 1.0) liquidityRisk = 'HIGH';
    else if (liquidityCoverageRatio < 1.5 || quickRatio < 1.5) liquidityRisk = 'MEDIUM';

    return {
      liquidityCoverageRatio,
      netStableFundingRatio,
      liquidityBuffer,
      cashRatio,
      quickRatio,
      liquidityRisk
    };
  }

  // Utility functions for statistical calculations
  private normalCDF(x: number): number {
    return (1.0 + this.erf(x / Math.sqrt(2.0))) / 2.0;
  }

  private normalPDF(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }

  private normalInverse(p: number): number {
    // Approximation of inverse normal distribution
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    
    const a1 = -3.969683028665376e+01;
    const a2 = 2.209460984245205e+02;
    const a3 = -2.759285104469687e+02;
    const a4 = 1.383577518672690e+02;
    const a5 = -3.066479806614716e+01;
    const a6 = 2.506628277459239e+00;

    const b1 = -5.447609879822406e+01;
    const b2 = 1.615858368580409e+02;
    const b3 = -1.556989798598866e+02;
    const b4 = 6.680131188771972e+01;
    const b5 = -1.328068155288572e+01;

    const c1 = -7.784894002430293e-03;
    const c2 = -3.223964580411365e-01;
    const c3 = -2.400758277161838e+00;
    const c4 = -2.549732539343734e+00;
    const c5 = 4.374664141464968e+00;
    const c6 = 2.938163982698783e+00;

    const d1 = 7.784695709041462e-03;
    const d2 = 3.224671290700398e-01;
    const d3 = 2.445134137142996e+00;
    const d4 = 3.754408661907416e+00;

    let q, t, u;

    if (p < 0.02425) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
             ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    } else if (p < 0.97575) {
      q = p - 0.5;
      t = q * q;
      return (((((a1 * t + a2) * t + a3) * t + a4) * t + a5) * t + a6) * q /
             (((((b1 * t + b2) * t + b3) * t + b4) * t + b5) * t + 1);
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
              ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    }
  }

  private erf(x: number): number {
    // Approximation of error function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }
}
