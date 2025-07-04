import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest, timer, of } from 'rxjs';
import { map, switchMap, shareReplay, distinctUntilChanged, catchError } from 'rxjs/operators';
import { MarketDataService, MarketData } from './market-data.service';
import { PositionService, Position, RiskMetrics } from './position.service';

export interface PortfolioPosition {
  position: Position;
  marketData: MarketData;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalUnrealizedPnL: number;
  totalUnrealizedPnLPercent: number;
  totalDayChange: number;
  totalDayChangePercent: number;
  positions: PortfolioPosition[];
  topGainers: PortfolioPosition[];
  topLosers: PortfolioPosition[];
  lastUpdated: Date;
}

export interface RealTimeRiskMetrics {
  portfolioValue: number;
  valueAtRisk95: number;
  valueAtRisk99: number;
  portfolioBeta: number;
  portfolioVolatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  concentrationRisk: number;
  diversificationRatio: number;
  lastUpdated: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PortfolioRealtimeService {
  private portfolioSummarySubject = new BehaviorSubject<PortfolioSummary | null>(null);
  private riskMetricsSubject = new BehaviorSubject<RealTimeRiskMetrics | null>(null);
  private currentPortfolioId = new BehaviorSubject<number>(1); // Default portfolio

  public portfolioSummary$ = this.portfolioSummarySubject.asObservable();
  public riskMetrics$ = this.riskMetricsSubject.asObservable();

  constructor(
    private marketDataService: MarketDataService,
    private positionService: PositionService
  ) {
    this.initializeRealTimeTracking();
  }

  private initializeRealTimeTracking(): void {
    // Update portfolio data every 5 seconds during market hours, 30 seconds after hours
    const updateInterval$ = timer(0, 5000).pipe(
      map(() => this.marketDataService.isMarketOpen() ? 5000 : 30000),
      distinctUntilChanged(),
      switchMap((interval: number) => timer(0, interval))
    );

    // Combine portfolio positions with real-time market data
    updateInterval$.pipe(
      switchMap(() => this.currentPortfolioId.pipe(
        switchMap(portfolioId => 
          combineLatest([
            this.positionService.getPositionsByPortfolio(portfolioId),
            this.positionService.getPortfolioRiskMetrics(portfolioId)
          ])
        )
      )),
      switchMap(([positions, riskMetrics]) => {
        const symbols = positions.map((p: Position) => p.symbol);
        
        // Track all symbols from portfolio
        symbols.forEach((symbol: string) => this.marketDataService.trackSymbol(symbol));
        
        return combineLatest([
          this.marketDataService.marketData$,
          this.createPortfolioSummary(positions),
          this.calculateRealTimeRiskMetrics(positions, riskMetrics)
        ]);
      }),
      shareReplay(1)
    ).subscribe(([marketData, portfolioSummary, riskMetrics]) => {
      this.portfolioSummarySubject.next(portfolioSummary);
      this.riskMetricsSubject.next(riskMetrics);
    });
  }

  private createPortfolioSummary(positions: Position[]): Observable<PortfolioSummary> {
    return this.marketDataService.marketData$.pipe(
      map((marketDataMap: Map<string, MarketData>) => {
        const portfolioPositions: PortfolioPosition[] = positions.map(position => {
          const marketData = marketDataMap.get(position.symbol);
          
          if (!marketData) {
            // Create default market data if not available
            const defaultMarketData: MarketData = {
              symbol: position.symbol,
              currentPrice: position.purchasePrice,
              previousClose: position.purchasePrice,
              change: 0,
              changePercent: 0,
              volume: 0,
              high: position.purchasePrice,
              low: position.purchasePrice,
              open: position.purchasePrice,
              marketCap: 0,
              timestamp: new Date()
            };
            
            return this.calculatePositionMetrics(position, defaultMarketData);
          }
          
          return this.calculatePositionMetrics(position, marketData);
        });

        const totalValue = portfolioPositions.reduce((sum, pos) => sum + pos.currentValue, 0);
        const totalUnrealizedPnL = portfolioPositions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);
        const totalDayChange = portfolioPositions.reduce((sum, pos) => sum + pos.dayChange, 0);

        // Sort positions for top gainers/losers
        const sortedByPnL = [...portfolioPositions].sort((a, b) => b.unrealizedPnLPercent - a.unrealizedPnLPercent);
        
        return {
          totalValue,
          totalUnrealizedPnL,
          totalUnrealizedPnLPercent: totalValue > 0 ? (totalUnrealizedPnL / (totalValue - totalUnrealizedPnL)) * 100 : 0,
          totalDayChange,
          totalDayChangePercent: totalValue > 0 ? (totalDayChange / totalValue) * 100 : 0,
          positions: portfolioPositions,
          topGainers: sortedByPnL.slice(0, 5),
          topLosers: sortedByPnL.slice(-5).reverse(),
          lastUpdated: new Date()
        };
      })
    );
  }

  private calculatePositionMetrics(position: Position, marketData: MarketData): PortfolioPosition {
    const currentValue = position.quantity * marketData.currentPrice;
    const costBasis = position.quantity * position.purchasePrice;
    const unrealizedPnL = currentValue - costBasis;
    const unrealizedPnLPercent = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;
    
    const dayChange = position.quantity * marketData.change;
    const dayChangePercent = marketData.changePercent;

    return {
      position,
      marketData,
      currentValue,
      unrealizedPnL,
      unrealizedPnLPercent,
      dayChange,
      dayChangePercent
    };
  }

  private calculateRealTimeRiskMetrics(positions: Position[], baseRiskMetrics: RiskMetrics): Observable<RealTimeRiskMetrics> {
    return this.marketDataService.marketData$.pipe(
      map((marketDataMap: Map<string, MarketData>) => {
        // Calculate current portfolio value
        const portfolioValue = positions.reduce((sum, position) => {
          const marketData = marketDataMap.get(position.symbol);
          const currentPrice = marketData?.currentPrice || position.purchasePrice;
          return sum + (position.quantity * currentPrice);
        }, 0);

        // Calculate portfolio volatility (simple estimation)
        const portfolioVolatility = this.calculatePortfolioVolatility(positions, marketDataMap);
        
        // Calculate portfolio beta (simple estimation)
        const portfolioBeta = this.calculatePortfolioBeta(positions, marketDataMap);

        // Scale VaR based on current portfolio value vs base metrics
        const scaleFactor = portfolioValue / (baseRiskMetrics.portfolioValue || 1);
        
        return {
          portfolioValue,
          valueAtRisk95: baseRiskMetrics.valueAtRisk95 * scaleFactor,
          valueAtRisk99: baseRiskMetrics.valueAtRisk99 * scaleFactor,
          portfolioBeta,
          portfolioVolatility,
          sharpeRatio: baseRiskMetrics.sharpeRatio,
          maxDrawdown: 0, // Would need historical data to calculate
          concentrationRisk: baseRiskMetrics.concentrationRisk,
          diversificationRatio: this.calculateDiversificationRatio(positions, marketDataMap),
          lastUpdated: new Date()
        };
      })
    );
  }

  private calculatePortfolioVolatility(positions: Position[], marketDataMap: Map<string, MarketData>): number {
    let totalValue = 0;
    let weightedVolatility = 0;

    positions.forEach(position => {
      const marketData = marketDataMap.get(position.symbol);
      const currentPrice = marketData?.currentPrice || position.purchasePrice;
      const positionValue = position.quantity * currentPrice;
      totalValue += positionValue;
      // Simple volatility estimation based on change percent (annualized approximation)
      const estimatedVolatility = Math.abs(marketData?.changePercent || 0) * 16; // ~sqrt(252) trading days
      weightedVolatility += positionValue * (estimatedVolatility / 100);
    });

    return totalValue > 0 ? weightedVolatility / totalValue : 0;
  }

  private calculatePortfolioBeta(positions: Position[], marketDataMap: Map<string, MarketData>): number {
    let totalValue = 0;
    let weightedBeta = 0;

    positions.forEach(position => {
      const marketData = marketDataMap.get(position.symbol);
      const currentPrice = marketData?.currentPrice || position.purchasePrice;
      const positionValue = position.quantity * currentPrice;
      totalValue += positionValue;
      // Simple beta estimation (default to 1 for stocks, could be enhanced with sector data)
      const estimatedBeta = 1; // Could be enhanced with market sector mapping
      weightedBeta += positionValue * estimatedBeta;
    });

    return totalValue > 0 ? weightedBeta / totalValue : 1;
  }

  private calculateDiversificationRatio(positions: Position[], marketDataMap: Map<string, MarketData>): number {
    // Simple diversification measure: 1 - Herfindahl index
    let totalValue = 0;
    const positionValues: number[] = [];

    positions.forEach(position => {
      const marketData = marketDataMap.get(position.symbol);
      const currentPrice = marketData?.currentPrice || position.purchasePrice;
      const positionValue = position.quantity * currentPrice;
      totalValue += positionValue;
      positionValues.push(positionValue);
    });

    if (totalValue === 0) return 0;

    const herfindahlIndex = positionValues.reduce((sum, value) => {
      const weight = value / totalValue;
      return sum + (weight * weight);
    }, 0);

    return 1 - herfindahlIndex;
  }

  // Public methods
  setPortfolioId(portfolioId: number): void {
    this.currentPortfolioId.next(portfolioId);
  }

  getCurrentPortfolioId(): number {
    return this.currentPortfolioId.value;
  }

  getPositionDetails(symbol: string): Observable<PortfolioPosition | null> {
    return this.portfolioSummary$.pipe(
      map(summary => summary?.positions.find(p => p.position.symbol === symbol) || null)
    );
  }

  getTopMovers(count: number = 5): Observable<{gainers: PortfolioPosition[], losers: PortfolioPosition[]}> {
    return this.portfolioSummary$.pipe(
      map(summary => {
        if (!summary) return { gainers: [], losers: [] };
        return {
          gainers: summary.topGainers.slice(0, count),
          losers: summary.topLosers.slice(0, count)
        };
      })
    );
  }

  refreshPortfolioData(): void {
    // Force refresh by updating the portfolio ID (triggers subscription)
    const currentId = this.currentPortfolioId.value;
    this.currentPortfolioId.next(currentId);
  }
}
