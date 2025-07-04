import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Position, PositionService, RiskMetrics } from '../services/position.service';
import { forkJoin, interval, Subscription } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'risk-dashboard',
  template: `
    <div class="risk-dashboard">
      <h2>🔍 Advanced Risk Analytics Dashboard</h2>
      
      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Calculating risk metrics...</p>
      </div>
      
      <div *ngIf="!loading && riskData.length > 0" class="dashboard-grid">
        
        <!-- Portfolio Risk Cards -->
        <div class="portfolio-section" *ngFor="let portfolio of riskData">
          <h3>Portfolio {{ portfolio.portfolioId }} Risk Analysis</h3>
          
          <div class="risk-cards">
            <!-- Portfolio Value -->
            <div class="risk-card primary">
              <div class="risk-icon">💰</div>
              <div class="risk-content">
                <div class="risk-label">Portfolio Value</div>
                <div class="risk-value">\${{ portfolio.metrics?.portfolioValue | number:'1.2-2' }}</div>
              </div>
            </div>
            
            <!-- Value at Risk 95% -->
            <div class="risk-card warning">
              <div class="risk-icon">⚠️</div>
              <div class="risk-content">
                <div class="risk-label">VaR (95%)</div>
                <div class="risk-value">\${{ portfolio.metrics?.valueAtRisk95 | number:'1.2-2' }}</div>
                <div class="risk-subtitle">Daily potential loss</div>
              </div>
            </div>
            
            <!-- Value at Risk 99% -->
            <div class="risk-card danger">
              <div class="risk-icon">🚨</div>
              <div class="risk-content">
                <div class="risk-label">VaR (99%)</div>
                <div class="risk-value">\${{ portfolio.metrics?.valueAtRisk99 | number:'1.2-2' }}</div>
                <div class="risk-subtitle">Extreme scenario</div>
              </div>
            </div>
            
            <!-- Sharpe Ratio -->
            <div class="risk-card success">
              <div class="risk-icon">📈</div>
              <div class="risk-content">
                <div class="risk-label">Sharpe Ratio</div>
                <div class="risk-value">{{ portfolio.metrics?.sharpeRatio | number:'1.3-3' }}</div>
                <div class="risk-subtitle">Risk-adjusted return</div>
              </div>
            </div>
            
            <!-- Concentration Risk -->
            <div class="risk-card" [class]="getConcentrationRiskClass(portfolio.metrics?.concentrationRisk)">
              <div class="risk-icon">🎯</div>
              <div class="risk-content">
                <div class="risk-label">Concentration Risk</div>
                <div class="risk-value">{{ portfolio.metrics?.concentrationRisk | number:'1.1-1' }}%</div>
                <div class="risk-subtitle">Largest position</div>
              </div>
            </div>
          </div>
          
          <!-- Asset Allocation Chart -->
          <div class="allocation-section">
            <h4>Asset Allocation</h4>
            <div class="allocation-chart">
              <div *ngFor="let allocation of getAssetAllocationArray(portfolio.metrics?.assetAllocation)" 
                   class="allocation-bar">
                <div class="allocation-label">{{ allocation.type }}</div>
                <div class="allocation-bar-container">
                  <div class="allocation-bar-fill" 
                       [style.width.%]="allocation.percentage"
                       [style.background-color]="allocation.color">
                  </div>
                  <span class="allocation-percentage">{{ allocation.percentage | number:'1.1-1' }}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Risk Interpretation -->
          <div class="risk-interpretation">
            <h4>Risk Interpretation</h4>
            <div class="interpretation-content">
              <div class="interpretation-item">
                <span class="interpretation-label">Risk Level:</span>
                <span class="interpretation-value" [class]="getRiskLevelClass(portfolio.metrics)">
                  {{ getRiskLevel(portfolio.metrics) }}
                </span>
              </div>
              <div class="interpretation-item">
                <span class="interpretation-label">Diversification:</span>
                <span class="interpretation-value" [class]="getDiversificationClass(portfolio.metrics?.concentrationRisk)">
                  {{ getDiversificationLevel(portfolio.metrics?.concentrationRisk) }}
                </span>
              </div>
              <div class="interpretation-item">
                <span class="interpretation-label">Performance:</span>
                <span class="interpretation-value" [class]="getPerformanceClass(portfolio.metrics?.sharpeRatio)">
                  {{ getPerformanceLevel(portfolio.metrics?.sharpeRatio) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div *ngIf="!loading && riskData.length === 0" class="no-data">
        <div class="no-data-icon">📊</div>
        <p>No risk data available</p>
      </div>
    </div>
  `,
  styles: [`
    .risk-dashboard {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }
    
    h2 {
      color: #2c3e50;
      margin-bottom: 2rem;
      font-size: 1.5rem;
      font-weight: 700;
    }
    
    .loading {
      text-align: center;
      padding: 3rem;
    }
    
    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .dashboard-grid {
      display: flex;
      flex-direction: column;
      gap: 3rem;
    }
    
    .portfolio-section {
      border: 2px solid #e9ecef;
      border-radius: 10px;
      padding: 1.5rem;
      background: #f8f9fa;
    }
    
    .portfolio-section h3 {
      color: #495057;
      margin: 0 0 1.5rem 0;
      font-size: 1.2rem;
      font-weight: 600;
    }
    
    .risk-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    
    .risk-card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      border-left: 4px solid #dee2e6;
      transition: transform 0.2s;
    }
    
    .risk-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .risk-card.primary { border-left-color: #007bff; }
    .risk-card.success { border-left-color: #28a745; }
    .risk-card.warning { border-left-color: #ffc107; }
    .risk-card.danger { border-left-color: #dc3545; }
    .risk-card.info { border-left-color: #17a2b8; }
    
    .risk-icon {
      font-size: 2rem;
      opacity: 0.8;
    }
    
    .risk-content {
      flex: 1;
    }
    
    .risk-label {
      font-size: 0.875rem;
      color: #6c757d;
      margin-bottom: 0.25rem;
      font-weight: 500;
    }
    
    .risk-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #2c3e50;
      line-height: 1;
    }
    
    .risk-subtitle {
      font-size: 0.75rem;
      color: #6c757d;
      margin-top: 0.25rem;
    }
    
    .allocation-section {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    
    .allocation-section h4 {
      color: #495057;
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
    }
    
    .allocation-chart {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .allocation-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .allocation-label {
      min-width: 80px;
      font-weight: 500;
      color: #495057;
      font-size: 0.875rem;
    }
    
    .allocation-bar-container {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .allocation-bar-fill {
      height: 20px;
      border-radius: 10px;
      min-width: 20px;
      transition: width 0.3s ease;
    }
    
    .allocation-percentage {
      font-size: 0.875rem;
      font-weight: 600;
      color: #495057;
      min-width: 40px;
    }
    
    .risk-interpretation {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
    }
    
    .risk-interpretation h4 {
      color: #495057;
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
    }
    
    .interpretation-content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .interpretation-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid #e9ecef;
    }
    
    .interpretation-item:last-child {
      border-bottom: none;
    }
    
    .interpretation-label {
      font-weight: 500;
      color: #495057;
    }
    
    .interpretation-value {
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.875rem;
    }
    
    .interpretation-value.low { background: #d4edda; color: #155724; }
    .interpretation-value.medium { background: #fff3cd; color: #856404; }
    .interpretation-value.high { background: #f8d7da; color: #721c24; }
    .interpretation-value.excellent { background: #d1ecf1; color: #0c5460; }
    .interpretation-value.good { background: #d4edda; color: #155724; }
    .interpretation-value.poor { background: #f8d7da; color: #721c24; }
    
    .no-data {
      text-align: center;
      padding: 3rem;
      color: #6c757d;
    }
    
    .no-data-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
  `],
  imports: [CommonModule]
})
export class RiskDashboardComponent implements OnInit, OnChanges, OnDestroy {
  @Input() positions: Position[] = [];
  
  riskData: { portfolioId: number, metrics: RiskMetrics | null }[] = [];
  loading = false;
  private updateSubscription: Subscription | null = null;
  
  constructor(private positionService: PositionService) {}
  
  ngOnInit() {
    this.loadRiskData();
    
    // Refresh data every 30 seconds for real-time updates
    this.updateSubscription = interval(30000)
      .pipe(
        switchMap(() => {
          // Get unique portfolio IDs from current positions
          const portfolioIds = [...new Set(this.positions.map(p => p.portfolioId))];
          
          if (portfolioIds.length === 0) {
            return of([]);
          }
          
          // Create observables for each portfolio's risk metrics
          const riskObservables = portfolioIds.map(portfolioId =>
            this.positionService.getPortfolioRiskMetrics(portfolioId).pipe(
              catchError(error => {
                console.error(`Error fetching risk metrics for portfolio ${portfolioId}:`, error);
                return of(null);
              })
            )
          );
          
          return forkJoin(riskObservables).pipe(
            catchError(error => {
              console.error('Error in forkJoin:', error);
              return of([]);
            })
          );
        })
      )
      .subscribe({
        next: (metrics: (RiskMetrics | null)[]) => {
          if (metrics.length > 0) {
            const portfolioIds = [...new Set(this.positions.map(p => p.portfolioId))];
            this.riskData = portfolioIds.map((portfolioId, index) => ({
              portfolioId,
              metrics: metrics[index]
            }));
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error in real-time updates:', error);
          this.loading = false;
        }
      });
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['positions']) {
      this.loadRiskData();
    }
  }
  
  ngOnDestroy() {
    this.updateSubscription?.unsubscribe();
  }
  
  loadRiskData() {
    if (!this.positions || this.positions.length === 0) {
      this.riskData = [];
      return;
    }
    
    this.loading = true;
    
    // Get unique portfolio IDs
    const portfolioIds = [...new Set(this.positions.map(p => p.portfolioId))];
    
    // Create observables for each portfolio's risk metrics
    const riskObservables = portfolioIds.map(portfolioId =>
      this.positionService.getPortfolioRiskMetrics(portfolioId)
    );
    
    // Execute all requests in parallel
    forkJoin(riskObservables).subscribe({
      next: (metrics) => {
        this.riskData = portfolioIds.map((portfolioId, index) => ({
          portfolioId,
          metrics: metrics[index]
        }));
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading risk data:', error);
        this.riskData = portfolioIds.map(portfolioId => ({
          portfolioId,
          metrics: null
        }));
        this.loading = false;
      }
    });
  }
  
  getAssetAllocationArray(allocation: { [key: string]: number } | undefined) {
    if (!allocation) return [];
    
    const colors = {
      'Equity': '#007bff',
      'Bond': '#28a745',
      'ETF': '#ffc107',
      'Derivative': '#dc3545'
    };
    
    return Object.entries(allocation).map(([type, percentage]) => ({
      type,
      percentage,
      color: colors[type as keyof typeof colors] || '#6c757d'
    }));
  }
  
  getConcentrationRiskClass(concentrationRisk: number | undefined): string {
    if (!concentrationRisk) return 'info';
    if (concentrationRisk < 20) return 'success';
    if (concentrationRisk < 40) return 'warning';
    return 'danger';
  }
  
  getRiskLevel(metrics: RiskMetrics | null): string {
    if (!metrics) return 'Unknown';
    
    const concentrationRisk = metrics.concentrationRisk;
    const sharpeRatio = metrics.sharpeRatio;
    
    if (concentrationRisk > 50 || sharpeRatio < 0) return 'High Risk';
    if (concentrationRisk > 30 || sharpeRatio < 0.5) return 'Medium Risk';
    return 'Low Risk';
  }
  
  getRiskLevelClass(metrics: RiskMetrics | null): string {
    const level = this.getRiskLevel(metrics);
    if (level === 'High Risk') return 'high';
    if (level === 'Medium Risk') return 'medium';
    return 'low';
  }
  
  getDiversificationLevel(concentrationRisk: number | undefined): string {
    if (!concentrationRisk) return 'Unknown';
    if (concentrationRisk < 20) return 'Well Diversified';
    if (concentrationRisk < 40) return 'Moderately Diversified';
    return 'Concentrated';
  }
  
  getDiversificationClass(concentrationRisk: number | undefined): string {
    const level = this.getDiversificationLevel(concentrationRisk);
    if (level === 'Well Diversified') return 'excellent';
    if (level === 'Moderately Diversified') return 'good';
    return 'poor';
  }
  
  getPerformanceLevel(sharpeRatio: number | undefined): string {
    if (!sharpeRatio) return 'Unknown';
    if (sharpeRatio > 1) return 'Excellent';
    if (sharpeRatio > 0.5) return 'Good';
    if (sharpeRatio > 0) return 'Fair';
    return 'Poor';
  }
  
  getPerformanceClass(sharpeRatio: number | undefined): string {
    const level = this.getPerformanceLevel(sharpeRatio);
    if (level === 'Excellent') return 'excellent';
    if (level === 'Good') return 'good';
    if (level === 'Fair') return 'medium';
    return 'poor';
  }
}
