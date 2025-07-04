import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PortfolioRealtimeService, PortfolioSummary, RealTimeRiskMetrics } from '../services/portfolio-realtime.service';
import { MarketDataService } from '../services/market-data.service';
import { AlertService, Alert } from '../services/alert.service';

@Component({
  selector: 'app-main-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="main-dashboard">
      <!-- Header Section -->
      <div class="dashboard-header">
        <div class="header-content">
          <div class="title-section">
            <h1>📊 Portfolio Dashboard</h1>
            <div class="market-status">
              <div class="status-indicator" [class.live]="marketStatus.isOpen"></div>
              <span class="status-text">{{marketStatus.status}}</span>
              <span class="last-update">Updated {{lastUpdate | date:'HH:mm:ss'}}</span>
            </div>
          </div>
          <div class="quick-actions">
            <button class="action-btn primary" (click)="refreshData()">
              <span class="icon">🔄</span> Refresh
            </button>
            <button class="action-btn" (click)="exportData()">
              <span class="icon">📊</span> Export
            </button>
          </div>
        </div>
      </div>

      <!-- Critical Alerts Banner -->
      <div class="alerts-banner" *ngIf="criticalAlerts.length > 0">
        <div class="alert-content">
          <div class="alert-icon">🚨</div>
          <div class="alert-text">
            <strong>{{criticalAlerts.length}} Critical Alert(s)</strong>
            <span>{{criticalAlerts.length > 0 ? criticalAlerts[0].message : 'No message'}}</span>
          </div>
          <button class="alert-action" (click)="viewAllAlerts()">View All</button>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="dashboard-grid">
        
        <!-- Portfolio Summary Card -->
        <div class="card portfolio-summary" *ngIf="portfolioSummary">
          <div class="card-header">
            <h2>💼 Portfolio Overview</h2>
            <div class="header-actions">
              <button class="icon-btn" title="Settings">⚙️</button>
            </div>
          </div>
          <div class="card-content">
            <div class="summary-metrics">
              <div class="metric">
                <div class="metric-value">\${{portfolioSummary.totalValue | number:'1.2-2'}}</div>
                <div class="metric-label">Total Value</div>
              </div>
              <div class="metric" [class.positive]="portfolioSummary.totalUnrealizedPnL >= 0" [class.negative]="portfolioSummary.totalUnrealizedPnL < 0">
                <div class="metric-value">
                  {{portfolioSummary.totalUnrealizedPnL >= 0 ? '+' : ''}}\${{portfolioSummary.totalUnrealizedPnL | number:'1.2-2'}}
                </div>
                <div class="metric-label">Unrealized P&L ({{portfolioSummary.totalUnrealizedPnLPercent | number:'1.2-2'}}%)</div>
              </div>
              <div class="metric" [class.positive]="portfolioSummary.totalDayChange >= 0" [class.negative]="portfolioSummary.totalDayChange < 0">
                <div class="metric-value">
                  {{portfolioSummary.totalDayChange >= 0 ? '+' : ''}}\${{portfolioSummary.totalDayChange | number:'1.2-2'}}
                </div>
                <div class="metric-label">Today's Change ({{portfolioSummary.totalDayChangePercent | number:'1.2-2'}}%)</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Risk Metrics Card -->
        <div class="card risk-metrics" *ngIf="riskMetrics">
          <div class="card-header">
            <h2>⚠️ Risk Analytics</h2>
          </div>
          <div class="card-content">
            <div class="risk-grid">
              <div class="risk-item">
                <div class="risk-label">VaR (95%)</div>
                <div class="risk-value">\${{riskMetrics.valueAtRisk95 | number:'1.2-2'}}</div>
              </div>
              <div class="risk-item">
                <div class="risk-label">Portfolio Beta</div>
                <div class="risk-value">{{riskMetrics.portfolioBeta | number:'1.2-2'}}</div>
              </div>
              <div class="risk-item">
                <div class="risk-label">Volatility</div>
                <div class="risk-value">{{riskMetrics.portfolioVolatility | number:'1.2-2'}}%</div>
              </div>
              <div class="risk-item">
                <div class="risk-label">Sharpe Ratio</div>
                <div class="risk-value">{{riskMetrics.sharpeRatio | number:'1.2-2'}}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Movers Card -->
        <div class="card top-movers" *ngIf="portfolioSummary">
          <div class="card-header">
            <h2>📈 Top Movers</h2>
          </div>
          <div class="card-content">
            <div class="movers-grid">
              <div class="movers-section">
                <h3 class="section-title gainers">🚀 Gainers</h3>
                <div class="movers-list">
                  <div class="mover-item" *ngFor="let pos of portfolioSummary.topGainers.slice(0, 3)">
                    <span class="symbol">{{pos.position.symbol}}</span>
                    <span class="change positive">+{{pos.unrealizedPnLPercent | number:'1.1-1'}}%</span>
                  </div>
                </div>
              </div>
              <div class="movers-section">
                <h3 class="section-title losers">📉 Losers</h3>
                <div class="movers-list">
                  <div class="mover-item" *ngFor="let pos of portfolioSummary.topLosers.slice(0, 3)">
                    <span class="symbol">{{pos.position.symbol}}</span>
                    <span class="change negative">{{pos.unrealizedPnLPercent | number:'1.1-1'}}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Holdings Table -->
        <div class="card holdings-table" *ngIf="portfolioSummary">
          <div class="card-header">
            <h2>📋 Current Holdings</h2>
            <div class="header-actions">
              <input type="text" placeholder="Search symbols..." class="search-input" [(ngModel)]="searchTerm">
            </div>
          </div>
          <div class="card-content">
            <div class="table-container">
              <table class="holdings-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th class="text-right">Shares</th>
                    <th class="text-right">Price</th>
                    <th class="text-right">Market Value</th>
                    <th class="text-right">Day Change</th>
                    <th class="text-right">Total P&L</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let pos of getFilteredPositions()" class="position-row">
                    <td>
                      <div class="symbol-cell">
                        <span class="symbol">{{pos.position.symbol}}</span>
                        <span class="type">{{pos.position.type}}</span>
                      </div>
                    </td>
                    <td class="text-right">{{pos.position.quantity | number:'1.0-0'}}</td>
                    <td class="text-right">
                      <div class="price-cell">
                        <span class="current-price">\${{pos.marketData.currentPrice | number:'1.2-2'}}</span>
                        <span class="price-change" [class.positive]="pos.marketData.change >= 0" [class.negative]="pos.marketData.change < 0">
                          {{pos.marketData.change >= 0 ? '+' : ''}}\${{pos.marketData.change | number:'1.2-2'}}
                        </span>
                      </div>
                    </td>
                    <td class="text-right market-value">\${{pos.currentValue | number:'1.2-2'}}</td>
                    <td class="text-right day-change" [class.positive]="pos.dayChange >= 0" [class.negative]="pos.dayChange < 0">
                      {{pos.dayChange >= 0 ? '+' : ''}}\${{pos.dayChange | number:'1.2-2'}}
                      <br><small>({{pos.dayChangePercent | number:'1.1-1'}}%)</small>
                    </td>
                    <td class="text-right total-pnl" [class.positive]="pos.unrealizedPnL >= 0" [class.negative]="pos.unrealizedPnL < 0">
                      {{pos.unrealizedPnL >= 0 ? '+' : ''}}\${{pos.unrealizedPnL | number:'1.2-2'}}
                      <br><small>({{pos.unrealizedPnLPercent | number:'1.1-1'}}%)</small>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .main-dashboard {
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }

    .dashboard-header {
      background: white;
      border-bottom: 1px solid #e1e5e9;
      padding: 20px 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1400px;
      margin: 0 auto;
    }

    .title-section h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 700;
      color: #1a202c;
    }

    .market-status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #64748b;
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ef4444;
      animation: pulse 2s infinite;
    }

    .status-indicator.live {
      background: #10b981;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .quick-actions {
      display: flex;
      gap: 12px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      background: white;
      color: #374151;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }

    .action-btn.primary {
      background: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }

    .action-btn.primary:hover {
      background: #2563eb;
    }

    .alerts-banner {
      background: linear-gradient(90deg, #fef2f2 0%, #fee2e2 100%);
      border: 1px solid #fca5a5;
      margin: 16px 24px;
      border-radius: 8px;
      padding: 16px;
    }

    .alert-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 1400px;
      margin: 0 auto;
    }

    .alert-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .alert-icon {
      font-size: 20px;
    }

    .alert-text strong {
      color: #dc2626;
      margin-right: 8px;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      grid-template-rows: auto auto auto;
      gap: 24px;
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
      transition: box-shadow 0.2s;
    }

    .card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .portfolio-summary {
      grid-column: 1 / -1;
    }

    .holdings-table {
      grid-column: 1 / -1;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px 16px;
      border-bottom: 1px solid #f1f5f9;
    }

    .card-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
    }

    .header-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .icon-btn {
      padding: 8px;
      border: none;
      background: none;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .icon-btn:hover {
      background: #f1f5f9;
    }

    .search-input {
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      width: 200px;
    }

    .card-content {
      padding: 0 24px 24px;
    }

    .summary-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 24px;
    }

    .metric {
      text-align: center;
      padding: 16px;
      border-radius: 8px;
      background: #f8fafc;
    }

    .metric-value {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 4px;
      color: #1e293b;
    }

    .metric-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 500;
    }

    .metric.positive .metric-value {
      color: #059669;
    }

    .metric.negative .metric-value {
      color: #dc2626;
    }

    .risk-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .risk-item {
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
      text-align: center;
    }

    .risk-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .risk-value {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
    }

    .movers-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .section-title {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
    }

    .section-title.gainers {
      color: #059669;
    }

    .section-title.losers {
      color: #dc2626;
    }

    .movers-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .mover-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #f8fafc;
      border-radius: 6px;
    }

    .symbol {
      font-weight: 600;
      color: #1e293b;
    }

    .change {
      font-weight: 500;
      font-size: 14px;
    }

    .change.positive {
      color: #059669;
    }

    .change.negative {
      color: #dc2626;
    }

    .table-container {
      overflow-x: auto;
    }

    .holdings-table {
      width: 100%;
      border-collapse: collapse;
    }

    .holdings-table th {
      text-align: left;
      padding: 12px;
      border-bottom: 2px solid #f1f5f9;
      font-weight: 600;
      color: #64748b;
      font-size: 12px;
      text-transform: uppercase;
    }

    .holdings-table td {
      padding: 16px 12px;
      border-bottom: 1px solid #f1f5f9;
    }

    .text-right {
      text-align: right;
    }

    .position-row:hover {
      background: #fafbfc;
    }

    .symbol-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .symbol-cell .symbol {
      font-weight: 600;
      color: #1e293b;
    }

    .symbol-cell .type {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
    }

    .price-cell {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
    }

    .current-price {
      font-weight: 600;
      color: #1e293b;
    }

    .price-change {
      font-size: 12px;
      font-weight: 500;
    }

    .price-change.positive {
      color: #059669;
    }

    .price-change.negative {
      color: #dc2626;
    }

    .market-value {
      font-weight: 600;
      color: #1e293b;
    }

    .day-change, .total-pnl {
      font-weight: 500;
    }

    .day-change.positive, .total-pnl.positive {
      color: #059669;
    }

    .day-change.negative, .total-pnl.negative {
      color: #dc2626;
    }

    .day-change small, .total-pnl small {
      opacity: 0.8;
    }

    @media (max-width: 1200px) {
      .dashboard-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 768px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
        padding: 16px;
        gap: 16px;
      }

      .header-content {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .summary-metrics {
        grid-template-columns: 1fr;
      }

      .movers-grid {
        grid-template-columns: 1fr;
      }

      .risk-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class MainDashboardComponent implements OnInit, OnDestroy {
  portfolioSummary: PortfolioSummary | null = null;
  riskMetrics: RealTimeRiskMetrics | null = null;
  criticalAlerts: Alert[] = [];
  marketStatus = { isOpen: false, status: 'Loading...' };
  lastUpdate = new Date();
  searchTerm = '';
  
  private subscriptions: Subscription[] = [];

  constructor(
    private portfolioRealtimeService: PortfolioRealtimeService,
    private marketDataService: MarketDataService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    // Subscribe to portfolio data
    const portfolioSub = this.portfolioRealtimeService.portfolioSummary$.subscribe(
      (summary) => {
        this.portfolioSummary = summary;
        this.lastUpdate = new Date();
      }
    );

    // Subscribe to risk metrics
    const riskSub = this.portfolioRealtimeService.riskMetrics$.subscribe(
      (metrics) => {
        this.riskMetrics = metrics;
      }
    );

    // Subscribe to alerts
    const alertsSub = this.alertService.alerts$.subscribe(
      (alerts) => {
        this.criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
      }
    );

    // Update market status
    this.updateMarketStatus();
    setInterval(() => this.updateMarketStatus(), 60000); // Update every minute

    this.subscriptions.push(portfolioSub, riskSub, alertsSub);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private updateMarketStatus() {
    this.marketStatus = this.marketDataService.getMarketStatusInfo();
  }

  getFilteredPositions() {
    if (!this.portfolioSummary || !this.searchTerm) {
      return this.portfolioSummary?.positions || [];
    }
    
    return this.portfolioSummary.positions.filter(pos => 
      pos.position.symbol.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  refreshData() {
    this.portfolioRealtimeService.refreshPortfolioData();
    this.lastUpdate = new Date();
  }

  exportData() {
    // Implement export functionality
    console.log('Exporting data...');
  }

  viewAllAlerts() {
    // Implement alerts view
    console.log('Viewing all alerts...');
  }
}
