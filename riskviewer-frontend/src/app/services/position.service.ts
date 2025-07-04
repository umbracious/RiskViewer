import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Position {
  id: number;
  symbol: string;
  type: string;
  quantity: number;
  purchasePrice: number;
  portfolioId: number;
  createdAt: string;
}

export interface RiskMetrics {
  portfolioValue: number;
  valueAtRisk95: number;
  valueAtRisk99: number;
  concentrationRisk: number;
  sharpeRatio: number;
  assetAllocation: { [key: string]: number };
}

export interface AdvancedRiskMetrics {
  portfolioValue: number;
  parametricVaR95: number;
  parametricVaR99: number;
  monteCarloVaR95: number;
  monteCarloVaR99: number;
  expectedShortfall95: number;
  expectedShortfall99: number;
  maxDrawdown: number;
  portfolioBeta: number;
  concentrationRisk: number;
  sharpeRatio: number;
  calmarRatio: number;
  sortinoRatio: number;
  omegaRatio: number;
  tailRatio: number;
  stressTestResults: { [key: string]: number };
  assetAllocation: { [key: string]: number };
}

export interface StructuredProduct {
  id: number;
  name: string;
  productType: string;
  underlyingAsset: string;
  maturityDate: string;
  notionalAmount: number;
  strike: number;
  barrier?: number;
  portfolioId: number;
  createdAt: string;
}

export interface RealTimeMarketData {
  symbol: string;
  currentPrice: number;
  volatility: number;
  lastUpdated: string;
  changePercent: number;
  alerts: RiskAlert[];
}

export interface RiskAlert {
  id: number;
  message: string;
  severity: string;
  alertType: string;
  portfolioId?: number;
  symbol?: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class PositionService {
  private readonly API_BASE_URL = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // Get all positions
  getAllPositions(): Observable<Position[]> {
    return this.http.get<Position[]>(`${this.API_BASE_URL}/positions`);
  }

  // Get positions by portfolio
  getPositionsByPortfolio(portfolioId: number): Observable<Position[]> {
    return this.http.get<Position[]>(`${this.API_BASE_URL}/positions/portfolio/${portfolioId}`);
  }

  // Get positions by symbol
  getPositionsBySymbol(symbol: string): Observable<Position[]> {
    return this.http.get<Position[]>(`${this.API_BASE_URL}/positions/symbol/${symbol}`);
  }

  // Get single position
  getPositionById(id: number): Observable<Position> {
    return this.http.get<Position>(`${this.API_BASE_URL}/positions/${id}`);
  }

  // Get portfolio risk metrics
  getPortfolioRiskMetrics(portfolioId: number): Observable<RiskMetrics> {
    return this.http.get<RiskMetrics>(`${this.API_BASE_URL}/risk/portfolio/${portfolioId}/metrics`);
  }

  // Get Value at Risk for specific confidence level
  getValueAtRisk(portfolioId: number, confidence: number = 0.95): Observable<number> {
    return this.http.get<number>(`${this.API_BASE_URL}/risk/portfolio/${portfolioId}/var?confidence=${confidence}`);
  }

  // Get asset allocation
  getAssetAllocation(portfolioId: number): Observable<{ [key: string]: number }> {
    return this.http.get<{ [key: string]: number }>(`${this.API_BASE_URL}/risk/portfolio/${portfolioId}/allocation`);
  }

  // Get advanced portfolio risk metrics
  getAdvancedRiskMetrics(portfolioId: number): Observable<AdvancedRiskMetrics> {
    return this.http.get<AdvancedRiskMetrics>(`${this.API_BASE_URL}/risk/portfolio/${portfolioId}/advanced-metrics`);
  }

  // Get Monte Carlo VaR
  getMonteCarloVaR(portfolioId: number, confidence: number = 0.95, simulations: number = 10000): Observable<number> {
    return this.http.get<number>(`${this.API_BASE_URL}/risk/portfolio/${portfolioId}/monte-carlo-var?confidence=${confidence}&simulations=${simulations}`);
  }

  // Get stress test results
  getStressTests(portfolioId: number): Observable<{ [key: string]: number }> {
    return this.http.get<{ [key: string]: number }>(`${this.API_BASE_URL}/risk/portfolio/${portfolioId}/stress-tests`);
  }

  // Get Expected Shortfall
  getExpectedShortfall(portfolioId: number, confidence: number = 0.95): Observable<number> {
    return this.http.get<number>(`${this.API_BASE_URL}/risk/portfolio/${portfolioId}/expected-shortfall?confidence=${confidence}`);
  }

  // Structured Products endpoints
  getAllStructuredProducts(): Observable<StructuredProduct[]> {
    return this.http.get<StructuredProduct[]>(`${this.API_BASE_URL}/structured-products`);
  }

  getStructuredProductsByPortfolio(portfolioId: number): Observable<StructuredProduct[]> {
    return this.http.get<StructuredProduct[]>(`${this.API_BASE_URL}/structured-products/portfolio/${portfolioId}`);
  }

  createStructuredProduct(product: Omit<StructuredProduct, 'id' | 'createdAt'>): Observable<StructuredProduct> {
    return this.http.post<StructuredProduct>(`${this.API_BASE_URL}/structured-products`, product);
  }

  getStructuredProductPricing(id: number): Observable<{fairValue: number, delta: number, gamma: number, theta: number, vega: number, rho: number}> {
    return this.http.get<{fairValue: number, delta: number, gamma: number, theta: number, vega: number, rho: number}>(`${this.API_BASE_URL}/structured-products/${id}/pricing`);
  }

  // Real-time market data endpoints
  getRealTimeMarketData(): Observable<RealTimeMarketData[]> {
    return this.http.get<RealTimeMarketData[]>(`${this.API_BASE_URL}/structured-products/real-time/market-data`);
  }

  getRealTimeMarketDataForSymbol(symbol: string): Observable<RealTimeMarketData> {
    return this.http.get<RealTimeMarketData>(`${this.API_BASE_URL}/structured-products/real-time/market-data/${symbol}`);
  }

  // Risk alerts endpoints
  getRiskAlerts(): Observable<RiskAlert[]> {
    return this.http.get<RiskAlert[]>(`${this.API_BASE_URL}/structured-products/real-time/alerts`);
  }

  getPortfolioRiskAlerts(portfolioId: number): Observable<RiskAlert[]> {
    return this.http.get<RiskAlert[]>(`${this.API_BASE_URL}/structured-products/real-time/alerts/portfolio/${portfolioId}`);
  }

  acknowledgeAlert(alertId: number): Observable<void> {
    return this.http.post<void>(`${this.API_BASE_URL}/structured-products/real-time/alerts/${alertId}/acknowledge`, {});
  }
}
