import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Position, PositionService, AdvancedRiskMetrics } from '../services/position.service';
import { AdvancedFinancialModelsService, StressTestResult, BlackScholesResult, CreditRiskMetrics } from '../services/advanced-financial-models.service';
import { ExportService } from '../services/export.service';
import { EnhancedVisualizationService } from '../services/enhanced-visualization.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'advanced-risk-analytics',
  template: `
    <div class="advanced-risk-container">
      <h2>🧮 Monte Carlo & Stress Testing Analytics</h2>
      
      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Running Monte Carlo simulations...</p>
      </div>
      
      <div *ngIf="!loading && advancedData.length > 0" class="analytics-grid">
        
        <div class="portfolio-analytics" *ngFor="let portfolio of advancedData">
          <h3>🎯 Portfolio {{ portfolio.portfolioId }} - Advanced Analytics</h3>
          
          <!-- VaR Comparison: Parametric vs Monte Carlo -->
          <div class="var-comparison">
            <h4>💡 Value at Risk Comparison</h4>
            <div class="comparison-grid">
              <div class="comparison-card">
                <div class="comparison-header">Parametric VaR</div>
                <div class="comparison-metrics">
                  <div class="metric-row">
                    <span class="metric-label">95% Confidence:</span>
                    <span class="metric-value">\${{ portfolio.metrics?.parametricVaR95 | number:'1.2-2' }}</span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">99% Confidence:</span>
                    <span class="metric-value">\${{ portfolio.metrics?.parametricVaR99 | number:'1.2-2' }}</span>
                  </div>
                </div>
                <div class="comparison-note">Based on normal distribution</div>
              </div>
              
              <div class="comparison-card featured">
                <div class="comparison-header">Monte Carlo VaR</div>
                <div class="comparison-metrics">
                  <div class="metric-row">
                    <span class="metric-label">95% Confidence:</span>
                    <span class="metric-value">\${{ portfolio.metrics?.monteCarloVaR95 | number:'1.2-2' }}</span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">99% Confidence:</span>
                    <span class="metric-value">\${{ portfolio.metrics?.monteCarloVaR99 | number:'1.2-2' }}</span>
                  </div>
                </div>
                <div class="comparison-note">10,000 simulations</div>
              </div>
            </div>
          </div>
          
          <!-- Advanced Risk Metrics Grid -->
          <div class="advanced-metrics-grid">
            
            <!-- Expected Shortfall -->
            <div class="advanced-metric-card danger">
              <div class="metric-icon">⚡</div>
              <div class="metric-content">
                <div class="metric-title">Expected Shortfall (95%)</div>
                <div class="metric-value">\${{ portfolio.metrics?.expectedShortfall95 | number:'1.2-2' }}</div>
                <div class="metric-subtitle">Average loss beyond VaR</div>
              </div>
            </div>
            
            <!-- Portfolio Beta -->
            <div class="advanced-metric-card" [class]="getBetaClass(portfolio.metrics?.portfolioBeta)">
              <div class="metric-icon">📊</div>
              <div class="metric-content">
                <div class="metric-title">Portfolio Beta</div>
                <div class="metric-value">{{ portfolio.metrics?.portfolioBeta | number:'1.3-3' }}</div>
                <div class="metric-subtitle">Systematic risk vs market</div>
              </div>
            </div>
            
            <!-- Max Drawdown -->
            <div class="advanced-metric-card warning">
              <div class="metric-icon">📉</div>
              <div class="metric-content">
                <div class="metric-title">Max Drawdown (1Y)</div>
                <div class="metric-value">\${{ portfolio.metrics?.maxDrawdown | number:'1.2-2' }}</div>
                <div class="metric-subtitle">Worst peak-to-trough loss</div>
              </div>
            </div>
            
            <!-- Expected Shortfall 99% -->
            <div class="advanced-metric-card critical">
              <div class="metric-icon">🔥</div>
              <div class="metric-content">
                <div class="metric-title">Expected Shortfall (99%)</div>
                <div class="metric-value">\${{ portfolio.metrics?.expectedShortfall99 | number:'1.2-2' }}</div>
                <div class="metric-subtitle">Tail risk measure</div>
              </div>
            </div>
          </div>
          
          <!-- Stress Testing Results -->
          <div class="stress-testing-section">
            <h4>🌪️ Stress Testing Scenarios</h4>
            <div class="stress-grid">
              <div *ngFor="let stress of getStressTestArray(portfolio.metrics?.stressTestResults)" 
                   class="stress-card" [class]="getStressClass(stress.loss, portfolio.metrics?.portfolioValue)">
                <div class="stress-header">
                  <div class="stress-icon">{{ getStressIcon(stress.scenario) }}</div>
                  <div class="stress-title">{{ stress.scenario }}</div>
                </div>
                <div class="stress-content">
                  <div class="stress-loss">\${{ stress.loss | number:'1.2-2' }}</div>
                  <div class="stress-percentage">{{ getStressPercentage(stress.loss, portfolio.metrics?.portfolioValue) }}% loss</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Risk Interpretation Matrix -->
          <div class="risk-matrix">
            <h4>🎯 Risk Assessment Matrix</h4>
            <div class="matrix-grid">
              <div class="matrix-item">
                <div class="matrix-category">Model Validation</div>
                <div class="matrix-comparison">
                  <span>MC vs Parametric VaR Difference:</span>
                  <span class="matrix-value" [class]="getModelValidationClass(portfolio.metrics)">
                    {{ getVarDifference(portfolio.metrics) }}%
                  </span>
                </div>
              </div>
              
              <div class="matrix-item">
                <div class="matrix-category">Tail Risk</div>
                <div class="matrix-comparison">
                  <span>ES vs VaR Ratio:</span>
                  <span class="matrix-value" [class]="getTailRiskClass(portfolio.metrics)">
                    {{ getESVarRatio(portfolio.metrics) }}x
                  </span>
                </div>
              </div>
              
              <div class="matrix-item">
                <div class="matrix-category">Market Sensitivity</div>
                <div class="matrix-comparison">
                  <span>Beta Category:</span>
                  <span class="matrix-value" [class]="getBetaClass(portfolio.metrics?.portfolioBeta)">
                    {{ getBetaCategory(portfolio.metrics?.portfolioBeta) }}
                  </span>
                </div>
              </div>
              
              <div class="matrix-item">
                <div class="matrix-category">Stress Vulnerability</div>
                <div class="matrix-comparison">
                  <span>Worst Case Scenario:</span>
                  <span class="matrix-value critical">
                    {{ getWorstStressScenario(portfolio.metrics?.stressTestResults) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Advanced Financial Models Section -->
      <div *ngIf="!loading && advancedData.length > 0" class="advanced-models-section">
        
        <!-- Black-Scholes Option Pricing -->
        <div class="model-card">
          <h3>🎯 Black-Scholes Option Pricing</h3>
          <div class="black-scholes-grid">
            <div class="bs-input-section">
              <h4>Option Parameters</h4>
              <div class="input-grid">
                <div class="input-group">
                  <label>Spot Price ($)</label>
                  <input type="number" [(ngModel)]="blackScholesParams.spotPrice" 
                         (input)="calculateBlackScholes()" class="form-input">
                </div>
                <div class="input-group">
                  <label>Strike Price ($)</label>
                  <input type="number" [(ngModel)]="blackScholesParams.strikePrice" 
                         (input)="calculateBlackScholes()" class="form-input">
                </div>
                <div class="input-group">
                  <label>Time to Expiry (years)</label>
                  <input type="number" [(ngModel)]="blackScholesParams.timeToExpiry" 
                         step="0.01" (input)="calculateBlackScholes()" class="form-input">
                </div>
                <div class="input-group">
                  <label>Volatility (%)</label>
                  <input type="number" [(ngModel)]="blackScholesParams.volatility" 
                         step="0.01" (input)="calculateBlackScholes()" class="form-input">
                </div>
              </div>
            </div>
            
            <div class="bs-results-section" *ngIf="blackScholesResult">
              <h4>Option Prices & Greeks</h4>
              <div class="results-grid">
                <div class="result-card call">
                  <div class="result-label">Call Option</div>
                  <div class="result-value">\${{ blackScholesResult.callPrice | number:'1.2-2' }}</div>
                </div>
                <div class="result-card put">
                  <div class="result-label">Put Option</div>
                  <div class="result-value">\${{ blackScholesResult.putPrice | number:'1.2-2' }}</div>
                </div>
                <div class="greeks-section">
                  <div class="greek-item">
                    <span>Delta:</span>
                    <span>{{ blackScholesResult.greeks.delta | number:'1.3-3' }}</span>
                  </div>
                  <div class="greek-item">
                    <span>Gamma:</span>
                    <span>{{ blackScholesResult.greeks.gamma | number:'1.3-3' }}</span>
                  </div>
                  <div class="greek-item">
                    <span>Theta:</span>
                    <span>{{ blackScholesResult.greeks.theta | number:'1.3-3' }}</span>
                  </div>
                  <div class="greek-item">
                    <span>Vega:</span>
                    <span>{{ blackScholesResult.greeks.vega | number:'1.3-3' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Stress Testing Results -->
        <div class="model-card" *ngIf="stressTestResults.length > 0">
          <h3>🌪️ Advanced Stress Testing</h3>
          <div class="stress-test-grid">
            <div *ngFor="let result of stressTestResults" class="stress-result-card"
                 [class]="getStressSeverityClass(result.percentageChange)">
              <div class="stress-header">
                <h4>{{ result.scenario }}</h4>
                <div class="stress-impact">{{ result.percentageChange | number:'1.1-1' }}%</div>
              </div>
              <div class="stress-description">{{ result.description }}</div>
              <div class="stress-metrics">
                <div class="stress-metric">
                  <span>Portfolio Value:</span>
                  <span>\${{ result.portfolioValue | number:'1.0-0' }}</span>
                </div>
                <div class="stress-metric">
                  <span>Max Drawdown:</span>
                  <span>{{ result.maxDrawdown }}%</span>
                </div>
                <div class="stress-metric">
                  <span>Recovery Time:</span>
                  <span>{{ result.recovery }} months</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Credit Risk Assessment -->
        <div class="model-card" *ngIf="creditRiskMetrics">
          <h3>💳 Credit Risk Assessment</h3>
          <div class="credit-risk-grid">
            <div class="credit-rating-section">
              <div class="credit-rating" [class]="getCreditRatingClass(creditRiskMetrics.creditRating)">
                {{ creditRiskMetrics.creditRating }}
              </div>
              <div class="rating-description">Credit Rating</div>
            </div>
            
            <div class="credit-metrics-section">
              <div class="credit-metric">
                <div class="metric-label">Probability of Default</div>
                <div class="metric-value">{{ (creditRiskMetrics.probabilityOfDefault * 100) | number:'1.2-2' }}%</div>
              </div>
              <div class="credit-metric">
                <div class="metric-label">Loss Given Default</div>
                <div class="metric-value">{{ (creditRiskMetrics.lossGivenDefault * 100) | number:'1.1-1' }}%</div>
              </div>
              <div class="credit-metric">
                <div class="metric-label">Expected Loss</div>
                <div class="metric-value">\${{ creditRiskMetrics.expectedLoss | number:'1.0-0' }}</div>
              </div>
              <div class="credit-metric">
                <div class="metric-label">Credit VaR</div>
                <div class="metric-value">\${{ creditRiskMetrics.creditVaR | number:'1.0-0' }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Export Actions -->
        <div class="export-actions">
          <button class="export-btn csv" (click)="exportToCSV()">
            📊 Export to CSV
          </button>
          <button class="export-btn pdf" (click)="exportToPDF()">
            📄 Generate PDF Report
          </button>
        </div>
      </div>
      
      <div *ngIf="!loading && advancedData.length === 0" class="no-data">
        <div class="no-data-icon">🔬</div>
        <p>No advanced analytics data available</p>
      </div>
    </div>
  `,
  styles: [`
    .advanced-risk-container {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 15px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }
    
    h2 {
      margin-bottom: 2rem;
      font-size: 1.6rem;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    
    .loading {
      text-align: center;
      padding: 3rem;
    }
    
    .spinner {
      border: 4px solid rgba(255,255,255,0.3);
      border-top: 4px solid white;
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
    
    .analytics-grid {
      display: flex;
      flex-direction: column;
      gap: 3rem;
    }
    
    .portfolio-analytics {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 2rem;
      border: 1px solid rgba(255,255,255,0.2);
    }
    
    .portfolio-analytics h3 {
      margin: 0 0 2rem 0;
      font-size: 1.3rem;
      font-weight: 600;
    }
    
    .var-comparison {
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .var-comparison h4 {
      margin: 0 0 1.5rem 0;
      font-size: 1.1rem;
    }
    
    .comparison-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }
    
    .comparison-card {
      background: rgba(255,255,255,0.15);
      border-radius: 8px;
      padding: 1.5rem;
      border: 1px solid rgba(255,255,255,0.2);
    }
    
    .comparison-card.featured {
      background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%);
      border: 2px solid rgba(255,215,0,0.5);
      transform: scale(1.02);
    }
    
    .comparison-header {
      font-weight: 600;
      margin-bottom: 1rem;
      font-size: 1rem;
    }
    
    .comparison-metrics {
      margin-bottom: 1rem;
    }
    
    .metric-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }
    
    .metric-label {
      font-size: 0.875rem;
      opacity: 0.9;
    }
    
    .metric-value {
      font-weight: 600;
      font-size: 0.875rem;
    }
    
    .comparison-note {
      font-size: 0.75rem;
      opacity: 0.7;
      font-style: italic;
    }
    
    .advanced-metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    
    .advanced-metric-card {
      background: rgba(255,255,255,0.15);
      border-radius: 10px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      border-left: 4px solid rgba(255,255,255,0.3);
      transition: all 0.3s ease;
    }
    
    .advanced-metric-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.2);
    }
    
    .advanced-metric-card.danger { border-left-color: #ff6b6b; }
    .advanced-metric-card.warning { border-left-color: #ffd93d; }
    .advanced-metric-card.success { border-left-color: #6bcf7f; }
    .advanced-metric-card.info { border-left-color: #4ecdc4; }
    .advanced-metric-card.critical { border-left-color: #ff4757; }
    
    .metric-icon {
      font-size: 2rem;
      opacity: 0.9;
    }
    
    .metric-content {
      flex: 1;
    }
    
    .metric-title {
      font-size: 0.875rem;
      opacity: 0.9;
      margin-bottom: 0.25rem;
    }
    
    .metric-value {
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 0.25rem;
    }
    
    .metric-subtitle {
      font-size: 0.75rem;
      opacity: 0.7;
    }
    
    .stress-testing-section {
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .stress-testing-section h4 {
      margin: 0 0 1.5rem 0;
      font-size: 1.1rem;
    }
    
    .stress-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    
    .stress-card {
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 1rem;
      border: 1px solid rgba(255,255,255,0.2);
    }
    
    .stress-card.low { border-left: 4px solid #6bcf7f; }
    .stress-card.medium { border-left: 4px solid #ffd93d; }
    .stress-card.high { border-left: 4px solid #ff6b6b; }
    .stress-card.critical { border-left: 4px solid #ff4757; }
    
    .stress-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
    
    .stress-icon {
      font-size: 1.2rem;
    }
    
    .stress-title {
      font-weight: 600;
      font-size: 0.875rem;
    }
    
    .stress-content {
      text-align: center;
    }
    
    .stress-loss {
      font-size: 1.2rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }
    
    .stress-percentage {
      font-size: 0.75rem;
      opacity: 0.8;
    }
    
    .risk-matrix {
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 1.5rem;
    }
    
    .risk-matrix h4 {
      margin: 0 0 1.5rem 0;
      font-size: 1.1rem;
    }
    
    .matrix-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }
    
    .matrix-item {
      background: rgba(255,255,255,0.1);
      border-radius: 6px;
      padding: 1rem;
    }
    
    .matrix-category {
      font-weight: 600;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }
    
    .matrix-comparison {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .matrix-value {
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.875rem;
    }
    
    .matrix-value.low { background: rgba(107, 207, 127, 0.3); }
    .matrix-value.medium { background: rgba(255, 217, 61, 0.3); }
    .matrix-value.high { background: rgba(255, 107, 107, 0.3); }
    .matrix-value.critical { background: rgba(255, 71, 87, 0.3); }
    .matrix-value.success { background: rgba(107, 207, 127, 0.3); }
    .matrix-value.warning { background: rgba(255, 217, 61, 0.3); }
    .matrix-value.danger { background: rgba(255, 107, 107, 0.3); }
    .matrix-value.info { background: rgba(78, 205, 196, 0.3); }
    
    .no-data {
      text-align: center;
      padding: 3rem;
    }
    
    .no-data-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    /* Advanced Models Styles */
    .advanced-models-section {
      margin-top: 2rem;
    }

    .model-card {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .model-card h3 {
      margin-bottom: 1.5rem;
      font-size: 1.3rem;
      font-weight: 600;
    }

    /* Black-Scholes Styles */
    .black-scholes-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .input-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .input-group {
      display: flex;
      flex-direction: column;
    }

    .input-group label {
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .form-input {
      padding: 0.5rem;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 0.9rem;
    }

    .form-input::placeholder {
      color: rgba(255, 255, 255, 0.6);
    }

    .results-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .result-card {
      background: rgba(255, 255, 255, 0.15);
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
    }

    .result-card.call {
      border-left: 4px solid #28a745;
    }

    .result-card.put {
      border-left: 4px solid #dc3545;
    }

    .result-label {
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
      opacity: 0.9;
    }

    .result-value {
      font-size: 1.4rem;
      font-weight: 700;
    }

    .greeks-section {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.05);
      padding: 1rem;
      border-radius: 8px;
    }

    .greek-item {
      display: flex;
      justify-content: space-between;
      padding: 0.25rem 0;
      font-size: 0.9rem;
    }

    /* Stress Test Styles */
    .stress-test-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
    }

    .stress-result-card {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 1rem;
      border-left: 4px solid;
    }

    .stress-result-card.low { border-left-color: #28a745; }
    .stress-result-card.medium { border-left-color: #ffc107; }
    .stress-result-card.high { border-left-color: #fd7e14; }
    .stress-result-card.severe { border-left-color: #dc3545; }

    .stress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .stress-header h4 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .stress-impact {
      font-size: 1.1rem;
      font-weight: 700;
    }

    .stress-description {
      font-size: 0.85rem;
      opacity: 0.9;
      margin-bottom: 1rem;
      line-height: 1.4;
    }

    .stress-metrics {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 0.5rem;
    }

    .stress-metric {
      text-align: center;
      font-size: 0.8rem;
    }

    /* Credit Risk Styles */
    .credit-risk-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 2rem;
      align-items: start;
    }

    .credit-rating-section {
      text-align: center;
    }

    .credit-rating {
      font-size: 3rem;
      font-weight: 900;
      padding: 1rem;
      border-radius: 12px;
      margin-bottom: 0.5rem;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    .credit-rating.excellent { background: linear-gradient(135deg, #28a745, #20c997); }
    .credit-rating.good { background: linear-gradient(135deg, #17a2b8, #6f42c1); }
    .credit-rating.fair { background: linear-gradient(135deg, #ffc107, #fd7e14); }
    .credit-rating.poor { background: linear-gradient(135deg, #dc3545, #e83e8c); }

    .rating-description {
      font-size: 0.9rem;
      opacity: 0.9;
    }

    .credit-metrics-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .credit-metric {
      background: rgba(255, 255, 255, 0.1);
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
    }

    .metric-label {
      font-size: 0.85rem;
      opacity: 0.9;
      margin-bottom: 0.5rem;
      display: block;
    }

    .metric-value {
      font-size: 1.2rem;
      font-weight: 700;
    }

    /* Export Actions */
    .export-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }

    .export-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .export-btn.csv {
      background: linear-gradient(135deg, #28a745, #20c997);
      color: white;
    }

    .export-btn.pdf {
      background: linear-gradient(135deg, #dc3545, #e83e8c);
      color: white;
    }

    .export-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }

    @media (max-width: 768px) {
      .black-scholes-grid,
      .credit-risk-grid {
        grid-template-columns: 1fr;
      }
      
      .input-grid {
        grid-template-columns: 1fr;
      }
      
      .stress-test-grid {
        grid-template-columns: 1fr;
      }
      
      .export-actions {
        flex-direction: column;
      }
    }
  `],
  imports: [CommonModule, FormsModule]
})
export class AdvancedRiskAnalyticsComponent implements OnInit, OnChanges {
  @Input() positions: Position[] = [];
  
  advancedData: { portfolioId: number, metrics: AdvancedRiskMetrics | null }[] = [];
  loading = false;
  
  // Advanced Financial Models Properties
  blackScholesParams = {
    spotPrice: 175,
    strikePrice: 180,
    timeToExpiry: 0.25,
    riskFreeRate: 0.05,
    volatility: 0.25,
    dividendYield: 0.02
  };
  
  blackScholesResult: BlackScholesResult | null = null;
  stressTestResults: StressTestResult[] = [];
  creditRiskMetrics: CreditRiskMetrics | null = null;
  
  constructor(
    private positionService: PositionService,
    private advancedModelsService: AdvancedFinancialModelsService,
    private exportService: ExportService
  ) {}
  
  ngOnInit() {
    this.loadAdvancedData();
    this.initializeAdvancedModels();
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['positions']) {
      this.loadAdvancedData();
    }
  }
  
  loadAdvancedData() {
    if (!this.positions || this.positions.length === 0) {
      this.advancedData = [];
      return;
    }
    
    this.loading = true;
    
    // Get unique portfolio IDs
    const portfolioIds = [...new Set(this.positions.map(p => p.portfolioId))];
    
    // Create observables for each portfolio's advanced metrics
    const advancedObservables = portfolioIds.map(portfolioId =>
      this.positionService.getAdvancedRiskMetrics(portfolioId)
    );
    
    // Execute all requests in parallel
    forkJoin(advancedObservables).subscribe({
      next: (metrics) => {
        this.advancedData = portfolioIds.map((portfolioId, index) => ({
          portfolioId,
          metrics: metrics[index]
        }));
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading advanced risk data:', error);
        this.advancedData = portfolioIds.map(portfolioId => ({
          portfolioId,
          metrics: null
        }));
        this.loading = false;
      }
    });
  }
  
  getStressTestArray(stressResults: { [key: string]: number } | undefined) {
    if (!stressResults) return [];
    
    return Object.entries(stressResults).map(([scenario, loss]) => ({
      scenario,
      loss
    }));
  }
  
  getStressIcon(scenario: string): string {
    const icons: { [key: string]: string } = {
      'Market Crash': '💥',
      'Interest Rate Shock': '📈',
      'Black Swan': '🦢',
      'Inflation Spike': '🔥'
    };
    return icons[scenario] || '⚠️';
  }
  
  getStressClass(loss: number, portfolioValue: number | undefined): string {
    if (!portfolioValue || portfolioValue === 0) return 'low';
    
    const percentage = (loss / portfolioValue) * 100;
    if (percentage > 40) return 'critical';
    if (percentage > 25) return 'high';
    if (percentage > 10) return 'medium';
    return 'low';
  }
  
  getStressPercentage(loss: number, portfolioValue: number | undefined): number {
    if (!portfolioValue || portfolioValue === 0) return 0;
    return Math.round((loss / portfolioValue) * 100 * 10) / 10;
  }
  
  getBetaClass(beta: number | undefined): string {
    if (!beta) return 'info';
    if (beta > 1.5) return 'danger';
    if (beta > 1.2) return 'warning';
    if (beta < 0.8) return 'info';
    return 'success';
  }
  
  getBetaCategory(beta: number | undefined): string {
    if (!beta) return 'Unknown';
    if (beta > 1.5) return 'High Beta';
    if (beta > 1.2) return 'Aggressive';
    if (beta > 0.8) return 'Market';
    return 'Defensive';
  }
  
  getVarDifference(metrics: AdvancedRiskMetrics | null): number {
    if (!metrics || !metrics.parametricVaR95 || !metrics.monteCarloVaR95) return 0;
    
    const difference = Math.abs(metrics.monteCarloVaR95 - metrics.parametricVaR95);
    const percentage = (difference / metrics.parametricVaR95) * 100;
    return Math.round(percentage * 10) / 10;
  }
  
  getModelValidationClass(metrics: AdvancedRiskMetrics | null): string {
    const diff = this.getVarDifference(metrics);
    if (diff > 20) return 'high';
    if (diff > 10) return 'medium';
    return 'low';
  }
  
  getESVarRatio(metrics: AdvancedRiskMetrics | null): number {
    if (!metrics || !metrics.expectedShortfall95 || !metrics.monteCarloVaR95) return 0;
    
    const ratio = metrics.expectedShortfall95 / metrics.monteCarloVaR95;
    return Math.round(ratio * 100) / 100;
  }
  
  getTailRiskClass(metrics: AdvancedRiskMetrics | null): string {
    const ratio = this.getESVarRatio(metrics);
    if (ratio > 1.5) return 'high';
    if (ratio > 1.3) return 'medium';
    return 'low';
  }
  
  getWorstStressScenario(stressResults: { [key: string]: number } | undefined): string {
    if (!stressResults) return 'Unknown';
    
    let worstScenario = '';
    let worstLoss = 0;
    
    Object.entries(stressResults).forEach(([scenario, loss]) => {
      if (loss > worstLoss) {
        worstLoss = loss;
        worstScenario = scenario;
      }
    });
    
    return worstScenario || 'None';
  }

  // Advanced Financial Models Methods
  initializeAdvancedModels() {
    this.calculateBlackScholes();
    this.loadStressTests();
    this.calculateCreditRisk();
  }

  calculateBlackScholes() {
    this.blackScholesResult = this.advancedModelsService.calculateBlackScholes(
      this.blackScholesParams.spotPrice,
      this.blackScholesParams.strikePrice,
      this.blackScholesParams.timeToExpiry,
      this.blackScholesParams.riskFreeRate,
      this.blackScholesParams.volatility,
      this.blackScholesParams.dividendYield
    );
  }

  loadStressTests() {
    const portfolioValue = this.getTotalPortfolioValue();
    if (portfolioValue > 0) {
      this.stressTestResults = this.advancedModelsService.performStressTests(portfolioValue, this.positions);
    }
  }

  calculateCreditRisk() {
    // Sample credit risk calculation with realistic parameters
    this.creditRiskMetrics = this.advancedModelsService.calculateCreditRisk(
      750, // Credit score
      0.5, // Debt to equity
      2.1, // Current ratio
      8.5, // Interest coverage
      3.2, // Industry risk
      this.getTotalPortfolioValue() * 0.3 // Exposure amount
    );
  }

  getTotalPortfolioValue(): number {
    return this.positions.reduce((total, position) => {
      return total + (position.quantity * position.purchasePrice);
    }, 0);
  }

  getStressSeverityClass(percentageChange: number): string {
    if (percentageChange < -30) return 'severe';
    if (percentageChange < -20) return 'high';
    if (percentageChange < -10) return 'medium';
    return 'low';
  }

  getCreditRatingClass(rating: string): string {
    if (['AAA', 'AA+', 'AA', 'AA-'].includes(rating)) return 'excellent';
    if (['A+', 'A', 'A-'].includes(rating)) return 'good';
    if (['BBB+', 'BBB', 'BBB-'].includes(rating)) return 'fair';
    return 'poor';
  }

  exportToCSV() {
    if (this.advancedData.length > 0 && this.advancedData[0].metrics) {
      this.exportService.exportRiskMetricsToCsv(this.advancedData[0].metrics);
    }
  }

  exportToPDF() {
    if (this.advancedData.length > 0 && this.advancedData[0].metrics) {
      this.exportService.generatePdfReport(this.positions, this.advancedData[0].metrics);
    }
  }
}
