import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Position } from "../services/position.service";

@Component({
  selector: "portfolio-overview",
  template: `
    <div class="overview-container">
      <h2>Portfolio Overview</h2>
      
      <div *ngIf="!positions || positions.length === 0" class="no-data">
        No portfolio data available
      </div>
      
      <div *ngIf="positions && positions.length > 0" class="overview-cards">
        <div class="card">
          <h3>Total Positions</h3>
          <div class="metric">{{ positions.length }}</div>
        </div>
        
        <div class="card">
          <h3>Total Portfolio Value</h3>
          <div class="metric">\${{ getTotalValue() | number:'1.2-2' }}</div>
        </div>
        
        <div class="card">
          <h3>Unique Symbols</h3>
          <div class="metric">{{ getUniqueSymbols() }}</div>
        </div>
        
        <div class="card">
          <h3>Portfolios</h3>
          <div class="metric">{{ getUniquePortfolios() }}</div>
        </div>
      </div>
      
      <div *ngIf="positions && positions.length > 0" class="breakdown">
        <h3>Portfolio Breakdown</h3>
        <div class="breakdown-item" *ngFor="let portfolio of getPortfolioBreakdown()">
          <span class="portfolio-name">Portfolio {{ portfolio.id }}</span>
          <span class="portfolio-count">{{ portfolio.count }} positions</span>
          <span class="portfolio-value">\${{ portfolio.value | number:'1.2-2' }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overview-container {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }
    h2 {
      color: #2c3e50;
      margin-bottom: 1.5rem;
    }
    .overview-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .card {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 6px;
      text-align: center;
      border-left: 4px solid #007bff;
    }
    .card h3 {
      color: #495057;
      font-size: 0.875rem;
      margin: 0 0 0.5rem 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .metric {
      font-size: 2rem;
      font-weight: 700;
      color: #2c3e50;
    }
    .breakdown {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 6px;
    }
    .breakdown h3 {
      color: #2c3e50;
      margin: 0 0 1rem 0;
    }
    .breakdown-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid #dee2e6;
    }
    .breakdown-item:last-child {
      border-bottom: none;
    }
    .portfolio-name {
      font-weight: 600;
      color: #495057;
    }
    .portfolio-count {
      color: #6c757d;
      font-size: 0.875rem;
    }
    .portfolio-value {
      font-weight: 600;
      color: #28a745;
    }
    .no-data {
      text-align: center;
      color: #6c757d;
      padding: 2rem;
    }
  `],
  imports: [CommonModule]
})
export class PortfolioOverview {
  @Input() positions: Position[] = [];

  getTotalValue(): number {
    return this.positions.reduce((total, position) => {
      return total + (position.quantity * position.purchasePrice);
    }, 0);
  }

  getUniqueSymbols(): number {
    const symbols = new Set(this.positions.map(p => p.symbol));
    return symbols.size;
  }

  getUniquePortfolios(): number {
    const portfolios = new Set(this.positions.map(p => p.portfolioId));
    return portfolios.size;
  }

  getPortfolioBreakdown() {
    const breakdown = new Map<number, { count: number, value: number }>();
    
    this.positions.forEach(position => {
      const existing = breakdown.get(position.portfolioId) || { count: 0, value: 0 };
      breakdown.set(position.portfolioId, {
        count: existing.count + 1,
        value: existing.value + (position.quantity * position.purchasePrice)
      });
    });

    return Array.from(breakdown.entries()).map(([id, data]) => ({
      id,
      count: data.count,
      value: data.value
    }));
  }
}