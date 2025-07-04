import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { PortfolioRealtimeService, PortfolioSummary, PortfolioPosition } from '../services/portfolio-realtime.service';

@Component({
  selector: 'app-portfolio-live-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="portfolio-live-view">
      <div class="header">
        <h2>📊 Live Portfolio Positions</h2>
        <div class="summary-stats" *ngIf="portfolioSummary">
          <div class="stat total-value">
            <span class="label">Total Value:</span>
            <span class="value">\${{portfolioSummary.totalValue | number:'1.2-2'}}</span>
          </div>
          <div class="stat total-pnl" [class.positive]="portfolioSummary.totalUnrealizedPnL >= 0" [class.negative]="portfolioSummary.totalUnrealizedPnL < 0">
            <span class="label">Total P&L:</span>
            <span class="value">{{portfolioSummary.totalUnrealizedPnL >= 0 ? '+' : ''}}\${{portfolioSummary.totalUnrealizedPnL | number:'1.2-2'}}</span>
            <span class="percent">({{portfolioSummary.totalUnrealizedPnLPercent | number:'1.2-2'}}%)</span>
          </div>
          <div class="stat day-change" [class.positive]="portfolioSummary.totalDayChange >= 0" [class.negative]="portfolioSummary.totalDayChange < 0">
            <span class="label">Day Change:</span>
            <span class="value">{{portfolioSummary.totalDayChange >= 0 ? '+' : ''}}\${{portfolioSummary.totalDayChange | number:'1.2-2'}}</span>
            <span class="percent">({{portfolioSummary.totalDayChangePercent | number:'1.2-2'}}%)</span>
          </div>
        </div>
      </div>

      <div class="positions-grid" *ngIf="portfolioSummary">
        <div class="position-card" *ngFor="let pos of portfolioSummary.positions" 
             [class.gaining]="pos.unrealizedPnL >= 0" 
             [class.losing]="pos.unrealizedPnL < 0">
          
          <div class="position-header">
            <h3 class="symbol">{{pos.position.symbol}}</h3>
            <div class="position-type">{{pos.position.type}}</div>
          </div>

          <div class="position-details">
            <div class="quantity-info">
              <span class="label">Quantity:</span>
              <span class="value">{{pos.position.quantity | number:'1.0-0'}} shares</span>
            </div>
            
            <div class="price-info">
              <div class="current-price">
                <span class="label">Current:</span>
                <span class="value">\${{pos.marketData.currentPrice | number:'1.2-2'}}</span>
                <span class="change" [class.positive]="pos.marketData.change >= 0" [class.negative]="pos.marketData.change < 0">
                  {{pos.marketData.change >= 0 ? '+' : ''}}\${{pos.marketData.change | number:'1.2-2'}}
                  ({{pos.marketData.changePercent | number:'1.2-2'}}%)
                </span>
              </div>
              <div class="purchase-price">
                <span class="label">Purchase:</span>
                <span class="value">\${{pos.position.purchasePrice | number:'1.2-2'}}</span>
              </div>
            </div>

            <div class="value-info">
              <div class="current-value">
                <span class="label">Market Value:</span>
                <span class="value">\${{pos.currentValue | number:'1.2-2'}}</span>
              </div>
              <div class="cost-basis">
                <span class="label">Cost Basis:</span>
                <span class="value">\${{pos.position.quantity * pos.position.purchasePrice | number:'1.2-2'}}</span>
              </div>
            </div>

            <div class="pnl-section">
              <div class="unrealized-pnl" [class.positive]="pos.unrealizedPnL >= 0" [class.negative]="pos.unrealizedPnL < 0">
                <span class="label">Unrealized P&L:</span>
                <div class="pnl-value">
                  <span class="amount">{{pos.unrealizedPnL >= 0 ? '+' : ''}}\${{pos.unrealizedPnL | number:'1.2-2'}}</span>
                  <span class="percent">({{pos.unrealizedPnLPercent | number:'1.2-2'}}%)</span>
                </div>
              </div>
              
              <div class="day-pnl" [class.positive]="pos.dayChange >= 0" [class.negative]="pos.dayChange < 0">
                <span class="label">Today's Change:</span>
                <div class="pnl-value">
                  <span class="amount">{{pos.dayChange >= 0 ? '+' : ''}}\${{pos.dayChange | number:'1.2-2'}}</span>
                  <span class="percent">({{pos.dayChangePercent | number:'1.2-2'}}%)</span>
                </div>
              </div>
            </div>
          </div>

          <div class="position-footer">
            <div class="last-updated">
              Updated: {{pos.marketData.timestamp | date:'HH:mm:ss'}}
            </div>
          </div>
        </div>
      </div>

      <div class="top-movers" *ngIf="portfolioSummary">
        <div class="movers-section">
          <h3>🚀 Top Gainers</h3>
          <div class="mover-list">
            <div class="mover-item" *ngFor="let pos of portfolioSummary.topGainers.slice(0, 3)">
              <span class="symbol">{{pos.position.symbol}}</span>
              <span class="change positive">+{{pos.unrealizedPnLPercent | number:'1.2-2'}}%</span>
            </div>
          </div>
        </div>

        <div class="movers-section">
          <h3>📉 Top Losers</h3>
          <div class="mover-list">
            <div class="mover-item" *ngFor="let pos of portfolioSummary.topLosers.slice(0, 3)">
              <span class="symbol">{{pos.position.symbol}}</span>
              <span class="change negative">{{pos.unrealizedPnLPercent | number:'1.2-2'}}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="no-data" *ngIf="!portfolioSummary">
        <p>Loading portfolio data...</p>
      </div>
    </div>
  `,
  styles: [`
    .portfolio-live-view {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 24px;
    }

    .header h2 {
      margin: 0 0 16px 0;
      color: #333;
      font-size: 24px;
    }

    .summary-stats {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat .label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      font-weight: 500;
    }

    .stat .value {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .stat .percent {
      font-size: 14px;
      margin-left: 8px;
    }

    .stat.positive .value,
    .stat.positive .percent {
      color: #10b981;
    }

    .stat.negative .value,
    .stat.negative .percent {
      color: #ef4444;
    }

    .positions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .position-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    .position-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    .position-card.gaining {
      border-left: 4px solid #10b981;
    }

    .position-card.losing {
      border-left: 4px solid #ef4444;
    }

    .position-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .symbol {
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
      margin: 0;
    }

    .position-type {
      background: #f3f4f6;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
    }

    .position-details {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .quantity-info,
    .price-info > div,
    .value-info > div {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .label {
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
    }

    .value {
      font-size: 14px;
      color: #1f2937;
      font-weight: 600;
    }

    .change {
      font-size: 12px;
      margin-left: 8px;
      font-weight: 500;
    }

    .change.positive {
      color: #10b981;
    }

    .change.negative {
      color: #ef4444;
    }

    .pnl-section {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #f3f4f6;
    }

    .unrealized-pnl,
    .day-pnl {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .pnl-value {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .amount {
      font-size: 16px;
      font-weight: 600;
    }

    .percent {
      font-size: 12px;
      opacity: 0.8;
    }

    .positive .amount,
    .positive .percent {
      color: #10b981;
    }

    .negative .amount,
    .negative .percent {
      color: #ef4444;
    }

    .position-footer {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #f3f4f6;
    }

    .last-updated {
      font-size: 11px;
      color: #9ca3af;
      text-align: right;
    }

    .top-movers {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-top: 32px;
    }

    .movers-section h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
      color: #374151;
    }

    .mover-list {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    .mover-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #f3f4f6;
    }

    .mover-item:last-child {
      border-bottom: none;
    }

    .mover-item .symbol {
      font-weight: 600;
      color: #1f2937;
    }

    .no-data {
      text-align: center;
      padding: 40px;
      color: #6b7280;
    }

    @media (max-width: 768px) {
      .positions-grid {
        grid-template-columns: 1fr;
      }
      
      .top-movers {
        grid-template-columns: 1fr;
      }
      
      .summary-stats {
        flex-direction: column;
        gap: 12px;
      }
    }
  `]
})
export class PortfolioLiveViewComponent implements OnInit, OnDestroy {
  portfolioSummary: PortfolioSummary | null = null;
  private subscriptions: Subscription[] = [];

  constructor(private portfolioRealtimeService: PortfolioRealtimeService) {}

  ngOnInit() {
    // Subscribe to portfolio summary
    const portfolioSub = this.portfolioRealtimeService.portfolioSummary$.subscribe(
      (summary: PortfolioSummary | null) => {
        this.portfolioSummary = summary;
      }
    );

    this.subscriptions.push(portfolioSub);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
