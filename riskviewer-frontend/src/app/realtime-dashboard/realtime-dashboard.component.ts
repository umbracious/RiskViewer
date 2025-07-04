import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, interval, combineLatest } from 'rxjs';
import { MarketDataService, MarketData } from '../services/market-data.service';
import { AlertService, Alert } from '../services/alert.service';
import { PositionService } from '../services/position.service';
import { PortfolioRealtimeService, PortfolioSummary, RealTimeRiskMetrics } from '../services/portfolio-realtime.service';

@Component({
  selector: 'app-realtime-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="realtime-dashboard">
      <!-- Header with Status -->
      <div class="dashboard-header">
        <h1>🚀 Real-Time Risk Dashboard</h1>
        <div class="status-bar">
          <div class="market-status">
            <div class="status-indicator" [class.live]="marketStatus.isOpen"></div>
            <span>{{marketStatus.status}}</span>
          </div>
          <div class="update-info">
            <span>Last Update: {{lastUpdate | date:'HH:mm:ss'}}</span>
            <span class="refresh-rate">{{refreshRate}}s refresh</span>
          </div>
        </div>
      </div>

      <!-- Critical Alerts Banner -->
      <div class="critical-alerts" *ngIf="criticalAlerts.length > 0">
        <div class="alert-banner">
          <div class="alert-icon">🚨</div>
          <div class="alert-content">
            <strong>{{criticalAlerts.length}} Critical Alert(s)</strong>
            <div class="alert-summary">
              <span *ngFor="let alert of criticalAlerts.slice(0, 3)">
                {{alert.symbol}}: {{alert.message.split(':')[1] || alert.message}} |
              </span>
            </div>
          </div>
          <button class="alert-action" (click)="viewAllAlerts()">View All</button>
        </div>
      </div>

      <!-- Portfolio Summary -->
      <div class="portfolio-summary" *ngIf="portfolioSummary">
        <div class="summary-header">
          <h2>Portfolio Overview</h2>
          <div class="portfolio-stats">
            <div class="total-value">
              <span class="label">Total Value:</span>
              <span class="value">\${{portfolioSummary.totalValue | number:'1.2-2'}}</span>
            </div>
            <div class="total-pnl" [class.positive]="portfolioSummary.totalUnrealizedPnL >= 0" [class.negative]="portfolioSummary.totalUnrealizedPnL < 0">
              <span class="label">Unrealized P&L:</span>
              <span class="value">{{portfolioSummary.totalUnrealizedPnL >= 0 ? '+' : ''}}\${{portfolioSummary.totalUnrealizedPnL | number:'1.2-2'}} ({{portfolioSummary.totalUnrealizedPnLPercent | number:'1.2-2'}}%)</span>
            </div>
            <div class="day-change" [class.positive]="portfolioSummary.totalDayChange >= 0" [class.negative]="portfolioSummary.totalDayChange < 0">
              <span class="label">Day Change:</span>
              <span class="value">{{portfolioSummary.totalDayChange >= 0 ? '+' : ''}}\${{portfolioSummary.totalDayChange | number:'1.2-2'}} ({{portfolioSummary.totalDayChangePercent | number:'1.2-2'}}%)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Stats Grid -->
      <div class="quick-stats">
        <div class="stat-card portfolio-value">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <div class="stat-value">\${{portfolioValue | number:'1.2-2'}}</div>
            <div class="stat-label">Portfolio Value</div>
            <div class="stat-change" [class.positive]="portfolioChange >= 0" [class.negative]="portfolioChange < 0">
              {{portfolioChange >= 0 ? '+' : ''}}{{portfolioChange | number:'1.2-2'}}%
            </div>
          </div>
        </div>

        <div class="stat-card unrealized-pnl">
          <div class="stat-icon">📈</div>
          <div class="stat-content">
            <div class="stat-value" [class.positive]="unrealizedPnL >= 0" [class.negative]="unrealizedPnL < 0">
              \${{unrealizedPnL | number:'1.2-2'}}
            </div>
            <div class="stat-label">Unrealized P&L</div>
            <div class="stat-change" [class.positive]="unrealizedPnLPercent >= 0" [class.negative]="unrealizedPnLPercent < 0">
              {{unrealizedPnLPercent >= 0 ? '+' : ''}}{{unrealizedPnLPercent | number:'1.2-2'}}%
            </div>
          </div>
        </div>

        <div class="stat-card top-performer">
          <div class="stat-icon">🏆</div>
          <div class="stat-content">
            <div class="stat-value">{{topPerformer?.symbol || 'N/A'}}</div>
            <div class="stat-label">Top Performer</div>
            <div class="stat-change positive" *ngIf="topPerformer">
              +{{topPerformer.changePercent | number:'1.2-2'}}%
            </div>
          </div>
        </div>

        <div class="stat-card worst-performer">
          <div class="stat-icon">📉</div>
          <div class="stat-content">
            <div class="stat-value">{{worstPerformer?.symbol || 'N/A'}}</div>
            <div class="stat-label">Worst Performer</div>
            <div class="stat-change negative" *ngIf="worstPerformer">
              {{worstPerformer.changePercent | number:'1.2-2'}}%
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="dashboard-grid">
        <!-- Market Heatmap -->
        <div class="dashboard-card market-heatmap">
          <div class="card-header">
            <h3>🔥 Market Heatmap</h3>
            <button class="btn-secondary" (click)="refreshMarketData()">Refresh</button>
          </div>
          <div class="heatmap-grid">
            <div 
              *ngFor="let data of marketDataArray" 
              class="heatmap-cell"
              [class.positive]="data.changePercent > 0"
              [class.negative]="data.changePercent < 0"
              [class.high-volatility]="Math.abs(data.changePercent) > 5"
              [style.background-color]="getHeatmapColor(data.changePercent)"
            >
              <div class="cell-symbol">{{data.symbol}}</div>
              <div class="cell-price">\${{data.currentPrice | number:'1.2-2'}}</div>
              <div class="cell-change">{{data.changePercent | number:'1.2-2'}}%</div>
            </div>
          </div>
        </div>

        <!-- Recent Alerts -->
        <div class="dashboard-card recent-alerts">
          <div class="card-header">
            <h3>⚠️ Recent Alerts</h3>
            <span class="alert-count">{{recentAlerts.length}} active</span>
          </div>
          <div class="alerts-list">
            <div 
              *ngFor="let alert of recentAlerts.slice(0, 5)" 
              class="alert-item"
              [class]="alert.severity"
            >
              <div class="alert-severity">{{getSeverityIcon(alert.severity)}}</div>
              <div class="alert-details">
                <div class="alert-symbol">{{alert.symbol}}</div>
                <div class="alert-message">{{alert.message}}</div>
                <div class="alert-time">{{alert.timestamp | date:'HH:mm:ss'}}</div>
              </div>
              <button class="alert-dismiss" (click)="dismissAlert(alert.id)">×</button>
            </div>
          </div>
        </div>

        <!-- Risk Metrics -->
        <div class="dashboard-card risk-metrics">
          <div class="card-header">
            <h3>⚖️ Risk Metrics</h3>
          </div>
          <div class="metrics-grid">
            <div class="metric-item">
              <div class="metric-label">Portfolio Beta</div>
              <div class="metric-value">{{portfolioBeta | number:'1.2-2'}}</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Sharpe Ratio</div>
              <div class="metric-value">{{sharpeRatio | number:'1.2-2'}}</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Max Drawdown</div>
              <div class="metric-value">{{maxDrawdown | number:'1.2-2'}}%</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Volatility (30d)</div>
              <div class="metric-value">{{volatility30d | number:'1.2-2'}}%</div>
            </div>
          </div>
        </div>

        <!-- Top Movers -->
        <div class="dashboard-card top-movers">
          <div class="card-header">
            <h3>🎯 Top Movers</h3>
          </div>
          <div class="movers-list">
            <div class="movers-section">
              <h4>Gainers</h4>
              <div *ngFor="let gainer of topGainers.slice(0, 3)" class="mover-item positive">
                <span class="mover-symbol">{{gainer.symbol}}</span>
                <span class="mover-price">\${{gainer.currentPrice | number:'1.2-2'}}</span>
                <span class="mover-change">+{{gainer.changePercent | number:'1.2-2'}}%</span>
              </div>
            </div>
            <div class="movers-section">
              <h4>Losers</h4>
              <div *ngFor="let loser of topLosers.slice(0, 3)" class="mover-item negative">
                <span class="mover-symbol">{{loser.symbol}}</span>
                <span class="mover-price">\${{loser.currentPrice | number:'1.2-2'}}</span>
                <span class="mover-change">{{loser.changePercent | number:'1.2-2'}}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .realtime-dashboard {
      padding: 1.5rem;
      background: #f8f9fa;
      min-height: 100vh;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .dashboard-header h1 {
      margin: 0;
      color: #2c3e50;
      font-size: 2rem;
    }

    .status-bar {
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .market-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
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

    .update-info {
      display: flex;
      flex-direction: column;
      font-size: 0.875rem;
      color: #6c757d;
    }

    .critical-alerts {
      margin-bottom: 2rem;
    }

    .alert-banner {
      display: flex;
      align-items: center;
      padding: 1rem 1.5rem;
      background: linear-gradient(135deg, #dc3545, #c82333);
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
    }

    .alert-icon {
      font-size: 1.5rem;
      margin-right: 1rem;
    }

    .alert-content {
      flex: 1;
    }

    .alert-summary {
      font-size: 0.875rem;
      opacity: 0.9;
      margin-top: 0.25rem;
    }

    .alert-action {
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
    }

    .portfolio-summary {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .summary-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .summary-header h2 {
      margin: 0;
      color: #495057;
      font-size: 1.5rem;
    }

    .portfolio-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      width: 100%;
    }

    .total-value, .total-pnl, .day-change {
      padding: 1rem;
      border-radius: 8px;
      background: #f8f9fa;
      text-align: center;
    }

    .total-value {
      border-left: 4px solid #007bff;
    }

    .total-pnl {
      border-left: 4px solid #28a745;
    }

    .day-change {
      border-left: 4px solid #ffc107;
    }

    .label {
      display: block;
      font-size: 0.875rem;
      color: #6c757d;
      margin-bottom: 0.25rem;
    }

    .value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #2c3e50;
    }

    .quick-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: transform 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    .stat-icon {
      font-size: 2rem;
      margin-right: 1rem;
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 0.25rem;
    }

    .stat-value.positive {
      color: #28a745;
    }

    .stat-value.negative {
      color: #dc3545;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #6c757d;
      margin-bottom: 0.25rem;
    }

    .stat-change {
      font-size: 0.875rem;
      font-weight: 600;
    }

    .stat-change.positive {
      color: #28a745;
    }

    .stat-change.negative {
      color: #dc3545;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
    }

    .dashboard-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .card-header h3 {
      margin: 0;
      color: #495057;
    }

    .heatmap-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 0.5rem;
    }

    .heatmap-cell {
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
      color: white;
      font-weight: 600;
      transition: transform 0.2s ease;
    }

    .heatmap-cell:hover {
      transform: scale(1.05);
    }

    .cell-symbol {
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }

    .cell-price {
      font-size: 1rem;
      margin-bottom: 0.25rem;
    }

    .cell-change {
      font-size: 0.75rem;
    }

    .alerts-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .alert-item {
      display: flex;
      align-items: center;
      padding: 0.75rem;
      border-radius: 6px;
      margin-bottom: 0.5rem;
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

    .alert-severity {
      margin-right: 0.75rem;
      font-size: 1.25rem;
    }

    .alert-details {
      flex: 1;
    }

    .alert-symbol {
      font-weight: 700;
      color: #495057;
    }

    .alert-message {
      font-size: 0.875rem;
      color: #6c757d;
      margin: 0.25rem 0;
    }

    .alert-time {
      font-size: 0.75rem;
      color: #adb5bd;
    }

    .alert-dismiss {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: #adb5bd;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .metric-item {
      text-align: center;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .metric-label {
      font-size: 0.875rem;
      color: #6c757d;
      display: block;
      margin-bottom: 0.5rem;
    }

    .metric-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #2c3e50;
    }

    .movers-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .movers-section h4 {
      margin: 0 0 0.5rem 0;
      color: #495057;
      font-size: 1rem;
    }

    .mover-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      font-size: 0.875rem;
    }

    .mover-item.positive {
      background: #d4edda;
      color: #155724;
    }

    .mover-item.negative {
      background: #f8d7da;
      color: #721c24;
    }

    .mover-symbol {
      font-weight: 700;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .quick-stats {
        grid-template-columns: repeat(2, 1fr);
      }

      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class RealtimeDashboardComponent implements OnInit, OnDestroy {
  marketDataArray: MarketData[] = [];
  marketStatus = { isOpen: false, status: 'Loading...' };
  lastUpdate: Date = new Date();
  refreshRate = 5;

  // Alerts
  criticalAlerts: Alert[] = [];
  recentAlerts: Alert[] = [];

  // Portfolio metrics
  portfolioValue = 0;
  portfolioChange = 0;
  unrealizedPnL = 0;
  unrealizedPnLPercent = 0;
  portfolioBeta = 1.2;
  sharpeRatio = 0.85;
  maxDrawdown = -5.2;
  volatility30d = 18.5;

  // Top performers
  topPerformer: MarketData | null = null;
  worstPerformer: MarketData | null = null;
  topGainers: MarketData[] = [];
  topLosers: MarketData[] = [];

  // Portfolio summary
  portfolioSummary: PortfolioSummary | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private marketDataService: MarketDataService,
    private alertService: AlertService,
    private positionService: PositionService,
    private portfolioRealtimeService: PortfolioRealtimeService
  ) {}

  ngOnInit() {
    this.initializeDashboard();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initializeDashboard() {
    // Subscribe to market data
    const marketDataSub = this.marketDataService.marketData$.subscribe(
      (marketDataMap: Map<string, MarketData>) => {
        this.marketDataArray = Array.from(marketDataMap.values());
        this.updateMetrics();
        this.lastUpdate = new Date();
      }
    );

    // Subscribe to alerts
    const alertsSub = this.alertService.alerts$.subscribe(
      (alerts: Alert[]) => {
        this.criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.acknowledged);
        this.recentAlerts = alerts.filter(a => !a.acknowledged).slice(0, 10);
      }
    );

    // Subscribe to portfolio summary
    const portfolioSub = this.portfolioRealtimeService.portfolioSummary$.subscribe(
      (summary: PortfolioSummary | null) => {
        this.portfolioSummary = summary;
        if (summary) {
          this.portfolioValue = summary.totalValue;
          this.unrealizedPnL = summary.totalUnrealizedPnL;
          this.unrealizedPnLPercent = summary.totalUnrealizedPnLPercent;
          this.portfolioChange = summary.totalDayChangePercent;
        }
      }
    );

    // Get market status
    this.marketStatus = this.marketDataService.getMarketStatusInfo();

    // Update market status every minute
    const statusSub = interval(60000).subscribe(() => {
      this.marketStatus = this.marketDataService.getMarketStatusInfo();
    });

    this.subscriptions.push(marketDataSub, alertsSub, portfolioSub, statusSub);

    // Track common symbols
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'SPY'];
    symbols.forEach(symbol => this.marketDataService.trackSymbol(symbol));
  }

  private updateMetrics() {
    if (this.marketDataArray.length === 0) return;

    // Calculate top/worst performers
    const sortedByChange = [...this.marketDataArray].sort((a, b) => b.changePercent - a.changePercent);
    this.topPerformer = sortedByChange[0];
    this.worstPerformer = sortedByChange[sortedByChange.length - 1];

    // Get top gainers and losers
    this.topGainers = sortedByChange.filter(d => d.changePercent > 0).slice(0, 5);
    this.topLosers = sortedByChange.filter(d => d.changePercent < 0).slice(-5).reverse();

    // Mock portfolio calculations (in real app, would use actual positions)
    this.portfolioValue = this.marketDataArray.reduce((sum, data) => sum + data.currentPrice * 10, 0);
    this.portfolioChange = this.marketDataArray.reduce((sum, data) => sum + data.changePercent, 0) / this.marketDataArray.length;
    this.unrealizedPnL = this.portfolioValue * (this.portfolioChange / 100);
    this.unrealizedPnLPercent = this.portfolioChange;
  }

  getHeatmapColor(changePercent: number): string {
    const intensity = Math.min(Math.abs(changePercent) / 10, 1);
    if (changePercent > 0) {
      return `rgba(40, 167, 69, ${0.3 + intensity * 0.7})`;
    } else {
      return `rgba(220, 53, 69, ${0.3 + intensity * 0.7})`;
    }
  }

  getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return '📊';
    }
  }

  refreshMarketData() {
    // Force refresh of all tracked symbols
    this.marketDataArray.forEach(data => {
      this.marketDataService.getMarketData(data.symbol).subscribe();
    });
  }

  dismissAlert(alertId: string) {
    this.alertService.dismissAlert(alertId);
  }

  viewAllAlerts() {
    // Navigate to full alerts view (implement as needed)
    console.log('Navigate to alerts view');
  }

  Math = Math; // Make Math available in template
}
