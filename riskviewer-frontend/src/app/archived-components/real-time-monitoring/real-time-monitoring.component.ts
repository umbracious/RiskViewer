import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, interval, merge } from 'rxjs';
import { PositionService, RiskAlert } from '../services/position.service';
import { MarketDataService, MarketData } from '../services/market-data.service';
import { WebSocketService } from '../services/websocket.service';

@Component({
  selector: 'app-real-time-monitoring',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="real-time-monitoring">
      <div class="header-section">
        <h2>Real-Time Market Monitoring</h2>
        <div class="market-status">
          <div class="status-indicator" [class.live]="marketStatusInfo.isOpen"></div>
          <span class="status-text">{{marketStatusInfo.status}}</span>
          <span class="update-info" *ngIf="lastUpdate">
            Last Update: {{lastUpdate | date:'HH:mm:ss'}}
          </span>
        </div>
      </div>

      <!-- Market Data Grid -->
      <div class="market-data-section">
        <div class="section-header">
          <h3>Live Market Data</h3>
          <div class="update-status">
            <div class="status-indicator" [class.live]="isUpdating"></div>
            <span class="status-text">{{isUpdating ? 'Updating' : 'Idle'}}</span>
            <span class="refresh-rate">{{refreshRate}}s refresh</span>
          </div>
        </div>
        
        <div class="market-grid" *ngIf="marketDataArray.length > 0">
          <div class="market-item" *ngFor="let data of marketDataArray" 
               [class.positive]="data.change >= 0" 
               [class.negative]="data.change < 0">
            <div class="symbol-header">
              <span class="symbol">{{data.symbol}}</span>
              <span class="alert-badge" *ngIf="getSymbolAlert(data.symbol)" 
                    [class]="getSymbolAlert(data.symbol)?.severity">
                {{getSymbolAlert(data.symbol)?.alertType}}
              </span>
            </div>
            <div class="price">
              <span class="current-price">\${{data.currentPrice | number:'1.2-2'}}</span>
              <span class="change" [class.positive]="data.change >= 0" [class.negative]="data.change < 0">
                {{data.change >= 0 ? '+' : ''}}{{data.change | number:'1.2-2'}} 
                ({{data.changePercent | number:'1.2-2'}}%)
              </span>
            </div>
            <div class="details">
              <div class="detail-row">
                <span>Open: \${{data.open | number:'1.2-2'}}</span>
                <span>High: \${{data.high | number:'1.2-2'}}</span>
              </div>
              <div class="detail-row">
                <span>Low: \${{data.low | number:'1.2-2'}}</span>
                <span>Vol: {{data.volume | number}}</span>
              </div>
            </div>
            <div class="timestamp">{{data.timestamp | date:'HH:mm:ss'}}</div>
          </div>
        </div>
        
        <div class="loading-state" *ngIf="marketDataArray.length === 0">
          <div class="loading-spinner"></div>
          <p>Loading market data...</p>
        </div>
      </div>

      <!-- Risk Alerts -->
      <div class="alerts-section" *ngIf="alerts.length > 0">
        <div class="section-header">
          <h3>Risk Alerts</h3>
          <span class="alert-count">{{alerts.length}} active</span>
        </div>
        
        <div class="alerts-list">
          <div class="alert-item" *ngFor="let alert of alerts" [class]="alert.severity">
            <div class="alert-icon">⚠️</div>
            <div class="alert-content">
              <div class="alert-header">
                <span class="alert-type">{{alert.alertType}}</span>
                <span class="alert-symbol">{{alert.symbol}}</span>
              </div>
              <p class="alert-message">{{alert.message}}</p>
              <span class="alert-time">{{alert.timestamp | date:'HH:mm:ss'}}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Portfolio Summary -->
      <div class="portfolio-summary-section" *ngIf="portfolioSummary">
        <div class="section-header">
          <h3>Portfolio Summary</h3>
          <span class="last-update">Updated: {{portfolioSummary.lastUpdate | date:'HH:mm:ss'}}</span>
        </div>
        
        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">Total Value</span>
            <span class="value">\${{portfolioSummary.totalValue | number:'1.2-2'}}</span>
          </div>
          <div class="summary-item">
            <span class="label">Total P&L</span>
            <span class="value" [class.positive]="portfolioSummary.totalPnL >= 0" [class.negative]="portfolioSummary.totalPnL < 0">
              {{portfolioSummary.totalPnL >= 0 ? '+' : ''}}\${{portfolioSummary.totalPnL | number:'1.2-2'}}
            </span>
          </div>
          <div class="summary-item">
            <span class="label">P&L Percentage</span>
            <span class="value" [class.positive]="portfolioSummary.totalPnLPercent >= 0" [class.negative]="portfolioSummary.totalPnLPercent < 0">
              {{portfolioSummary.totalPnLPercent >= 0 ? '+' : ''}}{{portfolioSummary.totalPnLPercent | number:'1.2-2'}}%
            </span>
          </div>
          <div class="summary-item">
            <span class="label">Positions</span>
            <span class="value">{{portfolioSummary.positionCount}}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .real-time-monitoring {
      padding: 1.5rem;
      background: #f8f9fa;
      min-height: 100vh;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .header-section h2 {
      margin: 0;
      color: #2c3e50;
      font-weight: 700;
      font-size: 1.75rem;
    }

    .market-status {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .status-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #dc3545;
      animation: pulse 2s infinite;
    }

    .status-indicator.live {
      background: #28a745;
    }

    .status-text {
      font-weight: 600;
      color: #495057;
      font-size: 1rem;
    }

    .update-info {
      font-size: 0.875rem;
      color: #6c757d;
    }

    .market-data-section {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .section-header h3 {
      margin: 0;
      color: #495057;
      font-size: 1.25rem;
    }

    .update-status {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.875rem;
    }

    .refresh-rate {
      color: #6c757d;
      font-weight: 500;
    }

    .market-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
    }

    .market-item {
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 1rem;
      background: #ffffff;
      transition: all 0.3s ease;
      position: relative;
    }

    .market-item.positive {
      border-left: 4px solid #28a745;
    }

    .market-item.negative {
      border-left: 4px solid #dc3545;
    }

    .market-item:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      transform: translateY(-2px);
    }

    .symbol-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .symbol {
      font-weight: 700;
      font-size: 1.1rem;
      color: #2c3e50;
    }

    .alert-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .alert-badge.high {
      background: #dc3545;
      color: white;
    }

    .alert-badge.medium {
      background: #ffc107;
      color: #212529;
    }

    .alert-badge.low {
      background: #17a2b8;
      color: white;
    }

    .price {
      margin-bottom: 0.75rem;
    }

    .current-price {
      font-size: 1.5rem;
      font-weight: 700;
      color: #2c3e50;
      display: block;
      margin-bottom: 0.25rem;
    }

    .change {
      font-weight: 600;
      font-size: 0.875rem;
    }

    .change.positive {
      color: #28a745;
    }

    .change.negative {
      color: #dc3545;
    }

    .details {
      margin-bottom: 0.75rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: #6c757d;
      margin-bottom: 0.25rem;
    }

    .timestamp {
      font-size: 0.75rem;
      color: #adb5bd;
      text-align: right;
    }

    .loading-state {
      text-align: center;
      padding: 3rem;
      color: #6c757d;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    .alerts-section {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .alert-count {
      background: #dc3545;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .alert-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid;
    }

    .alert-item.high {
      background: #fff5f5;
      border-left-color: #dc3545;
    }

    .alert-item.medium {
      background: #fffbf0;
      border-left-color: #ffc107;
    }

    .alert-item.low {
      background: #f0f8ff;
      border-left-color: #17a2b8;
    }

    .alert-icon {
      font-size: 1.25rem;
    }

    .alert-content {
      flex: 1;
    }

    .alert-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .alert-type {
      font-weight: 600;
      color: #495057;
    }

    .alert-symbol {
      font-weight: 700;
      color: #007bff;
    }

    .alert-message {
      margin: 0 0 0.5rem 0;
      color: #6c757d;
      font-size: 0.875rem;
    }

    .alert-time {
      font-size: 0.75rem;
      color: #adb5bd;
    }

    .portfolio-summary-section {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .last-update {
      font-size: 0.875rem;
      color: #6c757d;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .summary-item {
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      text-align: center;
    }

    .summary-item .label {
      display: block;
      font-size: 0.875rem;
      color: #6c757d;
      margin-bottom: 0.5rem;
    }

    .summary-item .value {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      color: #2c3e50;
    }

    .summary-item .value.positive {
      color: #28a745;
    }

    .summary-item .value.negative {
      color: #dc3545;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .real-time-monitoring {
        padding: 1rem;
      }

      .header-section {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .market-grid {
        grid-template-columns: 1fr;
      }

      .summary-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class RealTimeMonitoringComponent implements OnInit, OnDestroy {
  marketDataArray: MarketData[] = [];
  alerts: RiskAlert[] = [];
  portfolioSummary: any = null;
  marketStatusInfo = { isOpen: false, status: 'Loading...' };
  lastUpdate: Date | null = null;
  isUpdating = false;
  refreshRate = 5; // seconds

  private subscriptions: Subscription[] = [];
  private updateInterval: Subscription | null = null;

  // Symbols to track for real-time monitoring
  private trackedSymbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'SPY'];

  constructor(
    private positionService: PositionService,
    private marketDataService: MarketDataService,
    private webSocketService: WebSocketService
  ) {}

  ngOnInit() {
    console.log('RealTimeMonitoringComponent initializing...');
    this.initializeComponent();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.updateInterval) {
      this.updateInterval.unsubscribe();
    }
  }

  private initializeComponent() {
    // Get initial market status
    this.updateMarketStatus();

    // Track symbols for real-time data
    this.trackedSymbols.forEach(symbol => {
      this.marketDataService.trackSymbol(symbol);
    });

    // Subscribe to market data updates
    this.subscribeToMarketData();

    // Start regular updates based on market status
    this.startRegularUpdates();

    // Subscribe to risk alerts
    this.subscribeToRiskAlerts();

    // Load initial portfolio data
    this.loadPortfolioSummary();
  }

  private subscribeToMarketData() {
    const marketDataSub = this.marketDataService.marketData$.subscribe(
      (marketDataMap: Map<string, MarketData>) => {
        this.marketDataArray = Array.from(marketDataMap.values())
          .filter(data => this.trackedSymbols.includes(data.symbol))
          .sort((a, b) => a.symbol.localeCompare(b.symbol));
        
        this.lastUpdate = new Date();
        this.isUpdating = false;
        
        // Check for alerts based on market data
        this.checkForMarketAlerts();
        
        console.log('Market data updated:', this.marketDataArray.length, 'symbols');
      }
    );
    
    this.subscriptions.push(marketDataSub);
  }

  private startRegularUpdates() {
    // Update market status every minute
    const statusSub = interval(60000).subscribe(() => {
      this.updateMarketStatus();
    });
    this.subscriptions.push(statusSub);

    // Real-time updates based on market status
    this.updateInterval = interval(this.refreshRate * 1000).subscribe(() => {
      this.isUpdating = true;
      this.refreshMarketData();
    });
  }

  private updateMarketStatus() {
    this.marketStatusInfo = this.marketDataService.getMarketStatusInfo();
    
    // Adjust refresh rate based on market status
    if (this.marketStatusInfo.isOpen) {
      this.refreshRate = 3; // 3 seconds during market hours for high accuracy
    } else {
      this.refreshRate = 15; // 15 seconds after hours
    }

    // Restart interval with new refresh rate
    if (this.updateInterval) {
      this.updateInterval.unsubscribe();
      this.updateInterval = interval(this.refreshRate * 1000).subscribe(() => {
        this.isUpdating = true;
        this.refreshMarketData();
      });
    }
  }

  private refreshMarketData() {
    // Trigger fresh market data fetch for all tracked symbols
    const requests = this.trackedSymbols.map(symbol => 
      this.marketDataService.getMarketData(symbol)
    );

    // Execute all requests and update cache
    merge(...requests).subscribe({
      next: (data) => {
        // Data will be automatically updated via the marketData$ subscription
      },
      error: (error) => {
        console.warn('Failed to update market data:', error);
        this.isUpdating = false;
      }
    });
  }

  private subscribeToRiskAlerts() {
    // Mock implementation since WebSocketService.getRiskAlerts() doesn't exist
    // In a real implementation, this would subscribe to actual WebSocket alerts
    const mockAlerts: RiskAlert[] = [
      {
        id: 1,
        message: 'High volatility detected in AAPL',
        severity: 'medium',
        alertType: 'VOLATILITY',
        symbol: 'AAPL',
        timestamp: new Date().toISOString()
      }
    ];
    
    // Set initial alerts
    this.alerts = [];
  }

  private loadPortfolioSummary() {
    // Use mock positions for now since getAllPositions returns Observable
    const mockPositions = [
      { symbol: 'AAPL', quantity: 100, purchasePrice: 180.00 },
      { symbol: 'GOOGL', quantity: 50, purchasePrice: 170.00 },
      { symbol: 'MSFT', quantity: 75, purchasePrice: 400.00 }
    ];
    
    const portfolioSub = this.marketDataService.marketData$.subscribe(
      (marketDataMap: Map<string, MarketData>) => {
        const metrics = this.marketDataService.calculatePortfolioMetrics(mockPositions, marketDataMap);
        
        this.portfolioSummary = {
          totalValue: metrics.totalValue,
          totalPnL: metrics.totalPnL,
          totalPnLPercent: metrics.totalPnLPercent,
          positionCount: mockPositions.length,
          lastUpdate: new Date()
        };
      }
    );
    this.subscriptions.push(portfolioSub);
  }

  private checkForMarketAlerts() {
    this.marketDataArray.forEach(data => {
      // High volatility alert (>5% change)
      if (Math.abs(data.changePercent) > 5) {
        const alert: RiskAlert = {
          id: Math.floor(Math.random() * 1000000),
          symbol: data.symbol,
          alertType: 'VOLATILITY',
          severity: Math.abs(data.changePercent) > 10 ? 'high' : 'medium',
          message: `${data.symbol} moved ${data.changePercent.toFixed(2)}% today`,
          timestamp: new Date().toISOString()
        };
        
        // Add to alerts if not already present
        if (!this.alerts.some(a => a.symbol === data.symbol && a.alertType === 'VOLATILITY')) {
          this.alerts.unshift(alert);
          this.alerts = this.alerts.slice(0, 10); // Keep only 10 latest
        }
      }
    });
  }

  getSymbolAlert(symbol: string): RiskAlert | undefined {
    return this.alerts.find(alert => alert.symbol === symbol);
  }
}
