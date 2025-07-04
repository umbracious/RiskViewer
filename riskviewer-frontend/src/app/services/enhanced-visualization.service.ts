import { Injectable } from '@angular/core';
import { Position } from './position.service';

declare var Plotly: any;

export interface HeatmapData {
  asset: string;
  risk: number;
  return: number;
  weight: number;
  correlation: number;
  volatility: number;
  color: string;
}

export interface CorrelationMatrix {
  assets: string[];
  correlations: number[][];
  heatmapData: { x: number; y: number; value: number; }[];
}

export interface RiskSurfaceData {
  x: number[];  // Strike prices
  y: number[];  // Time to expiry
  z: number[][]; // Option values
  type: string;
}

export interface WaterfallData {
  categories: string[];
  values: number[];
  colors: string[];
  cumulative: number[];
}

@Injectable({
  providedIn: 'root'
})
export class EnhancedVisualizationService {

  constructor() { }

  // Generate Risk Concentration Heatmap
  generateRiskHeatmap(positions: Position[]): HeatmapData[] {
    const portfolioValue = positions.reduce((sum, p) => sum + (p.quantity * p.purchasePrice), 0);
    
    return positions.map(position => {
      const positionValue = position.quantity * position.purchasePrice;
      const weight = positionValue / portfolioValue;
      const volatility = this.estimateVolatility(position.symbol);
      const risk = weight * volatility * 100; // Risk score
      const expectedReturn = this.estimateReturn(position.symbol);
      const correlation = this.estimateCorrelation(position.symbol);
      
      return {
        asset: position.symbol,
        risk: risk,
        return: expectedReturn,
        weight: weight * 100,
        correlation: correlation,
        volatility: volatility * 100,
        color: this.getRiskColor(risk)
      };
    });
  }

  // Generate Asset Correlation Matrix
  generateCorrelationMatrix(positions: Position[]): CorrelationMatrix {
    const assets = [...new Set(positions.map(p => p.symbol))];
    const n = assets.length;
    const correlations: number[][] = [];
    const heatmapData: { x: number; y: number; value: number; }[] = [];
    
    // Generate correlation matrix
    for (let i = 0; i < n; i++) {
      correlations[i] = [];
      for (let j = 0; j < n; j++) {
        const correlation = i === j ? 1 : this.calculateAssetCorrelation(assets[i], assets[j]);
        correlations[i][j] = correlation;
        
        heatmapData.push({
          x: j,
          y: i,
          value: correlation
        });
      }
    }
    
    return {
      assets,
      correlations,
      heatmapData
    };
  }

  // Generate 3D Risk Surface for Options
  generateRiskSurface(spotPrice: number, type: 'call' | 'put' = 'call'): RiskSurfaceData {
    const strikes = [];
    const times = [];
    const values: number[][] = [];
    
    // Strike prices (80% to 120% of spot)
    for (let i = 0; i <= 20; i++) {
      strikes.push(spotPrice * (0.8 + (i * 0.02)));
    }
    
    // Time to expiry (0.1 to 2 years)
    for (let i = 0; i <= 20; i++) {
      times.push(0.1 + (i * 0.095));
    }
    
    // Calculate option values for each strike/time combination
    for (let i = 0; i < strikes.length; i++) {
      values[i] = [];
      for (let j = 0; j < times.length; j++) {
        const optionValue = this.calculateBlackScholesValue(
          spotPrice, strikes[i], times[j], 0.05, 0.25, type
        );
        values[i][j] = optionValue;
      }
    }
    
    return {
      x: strikes,
      y: times,
      z: values,
      type
    };
  }

  // Generate Risk Attribution Waterfall Chart
  generateRiskWaterfall(positions: Position[]): WaterfallData {
    const portfolioValue = positions.reduce((sum, p) => sum + (p.quantity * p.purchasePrice), 0);
    const categories = ['Base Portfolio'];
    const values = [portfolioValue];
    const colors = ['#007bff'];
    
    // Calculate risk contributions by asset
    const assetGroups = this.groupByAsset(positions);
    let cumulative = portfolioValue;
    
    Object.entries(assetGroups).forEach(([symbol, assetPositions]) => {
      const assetValue = assetPositions.reduce((sum, p) => sum + (p.quantity * p.purchasePrice), 0);
      const riskContribution = this.calculateRiskContribution(symbol, assetValue, portfolioValue);
      
      categories.push(`${symbol} Risk`);
      values.push(riskContribution);
      cumulative += riskContribution;
      colors.push(riskContribution > 0 ? '#dc3545' : '#28a745');
    });
    
    // Add market risk
    const marketRisk = portfolioValue * -0.05; // 5% market risk
    categories.push('Market Risk');
    values.push(marketRisk);
    cumulative += marketRisk;
    colors.push('#ffc107');
    
    // Final portfolio risk
    categories.push('Total Risk-Adjusted Value');
    values.push(0); // Placeholder
    colors.push('#6f42c1');
    
    return {
      categories,
      values,
      colors,
      cumulative: this.calculateCumulative(values)
    };
  }

  // Generate Time Series Risk Data
  generateTimeSeriesRisk(symbol: string, days: number = 252): { dates: string[], values: number[], volatility: number[] } {
    const dates: string[] = [];
    const values: number[] = [];
    const volatility: number[] = [];
    
    let currentPrice = this.getBasePrice(symbol);
    const baseVol = this.estimateVolatility(symbol);
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      dates.push(date.toISOString().split('T')[0]);
      
      // Simulate price movement with random walk
      const dailyReturn = (Math.random() - 0.5) * 0.04; // ±2% daily moves
      currentPrice *= (1 + dailyReturn);
      values.push(currentPrice);
      
      // Simulate volatility clustering
      const volShock = (Math.random() - 0.5) * 0.1;
      const currentVol = baseVol + (volShock * baseVol);
      volatility.push(Math.max(0.05, currentVol));
    }
    
    return { dates, values, volatility };
  }

  // Generate Efficient Frontier
  generateEfficientFrontier(positions: Position[]): { risk: number[], return: number[], weights: number[][] } {
    const assets = [...new Set(positions.map(p => p.symbol))];
    const numPortfolios = 50;
    const risk: number[] = [];
    const returns: number[] = [];
    const weights: number[][] = [];
    
    for (let i = 0; i < numPortfolios; i++) {
      // Generate random weights that sum to 1
      const portfolioWeights = this.generateRandomWeights(assets.length);
      weights.push(portfolioWeights);
      
      // Calculate portfolio return and risk
      let portfolioReturn = 0;
      let portfolioRisk = 0;
      
      for (let j = 0; j < assets.length; j++) {
        const assetReturn = this.estimateReturn(assets[j]);
        const assetVol = this.estimateVolatility(assets[j]);
        
        portfolioReturn += portfolioWeights[j] * assetReturn;
        portfolioRisk += Math.pow(portfolioWeights[j] * assetVol, 2);
      }
      
      // Add correlation effects (simplified)
      portfolioRisk = Math.sqrt(portfolioRisk) * 0.8; // Diversification benefit
      
      risk.push(portfolioRisk * 100);
      returns.push(portfolioReturn * 100);
    }
    
    return { risk, return: returns, weights };
  }

  // Chart Configuration Generators
  getHeatmapConfig(data: HeatmapData[]): any {
    return {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Risk vs Return',
          data: data.map(d => ({ x: d.risk, y: d.return, r: d.weight })),
          backgroundColor: data.map(d => d.color),
          borderColor: '#fff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Portfolio Risk Concentration Heatmap',
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const dataIndex = context.dataIndex;
                const item = data[dataIndex];
                return [
                  `Asset: ${item.asset}`,
                  `Risk Score: ${item.risk.toFixed(1)}`,
                  `Expected Return: ${item.return.toFixed(1)}%`,
                  `Weight: ${item.weight.toFixed(1)}%`,
                  `Volatility: ${item.volatility.toFixed(1)}%`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Risk Score' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          },
          y: {
            title: { display: true, text: 'Expected Return (%)' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          }
        }
      }
    };
  }

  getCorrelationHeatmapConfig(matrix: CorrelationMatrix): any {
    return {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Correlation',
          data: matrix.heatmapData.map(d => ({
            x: d.x,
            y: d.y,
            v: d.value
          })),
          backgroundColor: (ctx: any) => {
            const value = ctx.parsed.v;
            return this.getCorrelationColor(value);
          },
          pointRadius: 20,
          pointHoverRadius: 25
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Asset Correlation Matrix',
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            callbacks: {
              title: () => '',
              label: (context: any) => {
                const x = context.parsed.x;
                const y = context.parsed.y;
                const value = context.parsed.v;
                return `${matrix.assets[y]} vs ${matrix.assets[x]}: ${value.toFixed(3)}`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            min: -0.5,
            max: matrix.assets.length - 0.5,
            ticks: {
              stepSize: 1,
              callback: (value: any) => matrix.assets[value] || ''
            }
          },
          y: {
            type: 'linear',
            min: -0.5,
            max: matrix.assets.length - 0.5,
            ticks: {
              stepSize: 1,
              callback: (value: any) => matrix.assets[value] || ''
            }
          }
        }
      }
    };
  }

  // Additional Chart Configuration Methods
  getPortfolioAllocationConfig(labels: string[], values: number[]): any {
    const colors = [
      '#007bff', '#28a745', '#ffc107', '#dc3545', 
      '#6f42c1', '#20c997', '#fd7e14', '#6c757d'
    ];

    return {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: '#fff',
          borderWidth: 2,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Portfolio Allocation',
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: $${context.parsed.toLocaleString()} (${percentage}%)`;
              }
            }
          }
        }
      }
    };
  }

  getVaRDistributionConfig(values: number[], var95: number): any {
    const bins = 50;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / bins;
    
    const histogram = Array(bins).fill(0);
    const labels = [];
    
    for (let i = 0; i < bins; i++) {
      labels.push(min + i * binWidth);
    }
    
    values.forEach(value => {
      const bin = Math.min(Math.floor((value - min) / binWidth), bins - 1);
      histogram[bin]++;
    });

    return {
      type: 'bar',
      data: {
        labels: labels.map(l => l.toFixed(0)),
        datasets: [{
          label: 'Loss Distribution',
          data: histogram,
          backgroundColor: labels.map(l => l <= var95 ? '#dc3545' : '#007bff'),
          borderColor: '#fff',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Value at Risk Distribution (VaR 95%: $${var95.toFixed(0)})`,
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Potential Loss ($)' }
          },
          y: {
            title: { display: true, text: 'Frequency' }
          }
        }
      }
    };
  }

  // Plotly.js chart methods for 3D and advanced visualizations
  createRiskHeatmap(element: HTMLElement, matrix: number[][], labels: any): void {
    const data = [{
      z: matrix,
      x: labels.riskTypes,
      y: labels.portfolios,
      type: 'heatmap',
      colorscale: [
        [0, '#28a745'],
        [0.5, '#ffc107'],
        [1, '#dc3545']
      ],
      hoverongaps: false,
      hovertemplate: '<b>%{y}</b><br>%{x}: %{z:.1f}<extra></extra>'
    }];

    const layout = {
      title: 'Portfolio Risk Heatmap',
      xaxis: { title: 'Risk Type' },
      yaxis: { title: 'Portfolio' },
      margin: { t: 50, l: 100, r: 50, b: 100 }
    };

    if (typeof Plotly !== 'undefined') {
      Plotly.newPlot(element, data, layout, { responsive: true });
    }
  }

  createCorrelationMatrix(element: HTMLElement, matrix: number[][], assets: string[]): void {
    const data = [{
      z: matrix,
      x: assets,
      y: assets,
      type: 'heatmap',
      colorscale: [
        [0, '#0066cc'],
        [0.5, '#ffffff'],
        [1, '#cc0000']
      ],
      zmid: 0,
      hoverongaps: false,
      hovertemplate: '<b>%{y} vs %{x}</b><br>Correlation: %{z:.3f}<extra></extra>'
    }];

    const layout = {
      title: 'Asset Correlation Matrix',
      xaxis: { title: 'Assets', tickangle: -45 },
      yaxis: { title: 'Assets' },
      margin: { t: 50, l: 100, r: 50, b: 150 }
    };

    if (typeof Plotly !== 'undefined') {
      Plotly.newPlot(element, data, layout, { responsive: true });
    }
  }

  create3DRiskSurface(element: HTMLElement, x: number[], y: number[], z: number[][]): void {
    const data = [{
      x: x,
      y: y,
      z: z,
      type: 'surface',
      colorscale: [
        [0, '#1f77b4'],
        [0.5, '#ff7f0e'],
        [1, '#d62728']
      ],
      hovertemplate: 'X: %{x}<br>Y: %{y}<br>Risk: %{z:.2f}<extra></extra>'
    }];

    const layout = {
      title: '3D Risk Surface',
      scene: {
        xaxis: { title: 'Factor 1' },
        yaxis: { title: 'Factor 2' },
        zaxis: { title: 'Risk Level' }
      },
      margin: { t: 50, l: 50, r: 50, b: 50 }
    };

    if (typeof Plotly !== 'undefined') {
      Plotly.newPlot(element, data, layout, { responsive: true });
    }
  }

  createEfficientFrontier(element: HTMLElement, risk: number[], returns: number[], currentPortfolio: any): void {
    const frontierTrace = {
      x: risk,
      y: returns,
      mode: 'lines+markers',
      type: 'scatter',
      name: 'Efficient Frontier',
      marker: { color: '#007bff', size: 4 },
      line: { color: '#007bff', width: 2 }
    };

    const currentTrace = {
      x: [currentPortfolio.risk],
      y: [currentPortfolio.return],
      mode: 'markers',
      type: 'scatter',
      name: 'Current Portfolio',
      marker: { 
        color: '#dc3545', 
        size: 12, 
        symbol: 'diamond',
        line: { color: '#fff', width: 2 }
      }
    };

    const data = [frontierTrace, currentTrace];

    const layout = {
      title: 'Efficient Frontier Analysis',
      xaxis: { title: 'Risk (Volatility)' },
      yaxis: { title: 'Expected Return' },
      hovermode: 'closest',
      margin: { t: 50, l: 60, r: 50, b: 60 }
    };

    if (typeof Plotly !== 'undefined') {
      Plotly.newPlot(element, data, layout, { responsive: true });
    }
  }

  // Helper Methods
  private estimateVolatility(symbol: string): number {
    const volatilities: { [key: string]: number } = {
      'AAPL': 0.25, 'MSFT': 0.22, 'GOOGL': 0.28, 'TSLA': 0.45,
      'SPY': 0.18, 'QQQ': 0.21, 'BTC': 0.80, 'ETH': 0.85
    };
    return volatilities[symbol] || 0.25;
  }

  private estimateReturn(symbol: string): number {
    const returns: { [key: string]: number } = {
      'AAPL': 0.12, 'MSFT': 0.11, 'GOOGL': 0.13, 'TSLA': 0.18,
      'SPY': 0.10, 'QQQ': 0.12, 'BTC': 0.25, 'ETH': 0.22
    };
    return returns[symbol] || 0.10;
  }

  private estimateCorrelation(symbol: string): number {
    // Simplified correlation with market
    return Math.random() * 0.6 + 0.2; // 0.2 to 0.8
  }

  private calculateAssetCorrelation(asset1: string, asset2: string): number {
    if (asset1 === asset2) return 1;
    
    // Simplified correlation calculation
    const correlations: { [key: string]: number } = {
      'AAPL-MSFT': 0.65, 'AAPL-GOOGL': 0.58, 'MSFT-GOOGL': 0.72,
      'SPY-QQQ': 0.85, 'BTC-ETH': 0.75
    };
    
    const key = [asset1, asset2].sort().join('-');
    return correlations[key] || (Math.random() * 0.6 + 0.1); // 0.1 to 0.7
  }

  private getRiskColor(risk: number): string {
    if (risk > 15) return '#dc3545'; // High risk - Red
    if (risk > 10) return '#fd7e14'; // Medium-high risk - Orange
    if (risk > 5) return '#ffc107';  // Medium risk - Yellow
    return '#28a745'; // Low risk - Green
  }

  private getCorrelationColor(correlation: number): string {
    const intensity = Math.abs(correlation);
    const alpha = 0.3 + (intensity * 0.7);
    
    if (correlation > 0) {
      return `rgba(220, 53, 69, ${alpha})`; // Red for positive correlation
    } else {
      return `rgba(40, 167, 69, ${alpha})`; // Green for negative correlation
    }
  }

  private groupByAsset(positions: Position[]): { [symbol: string]: Position[] } {
    return positions.reduce((groups, position) => {
      if (!groups[position.symbol]) {
        groups[position.symbol] = [];
      }
      groups[position.symbol].push(position);
      return groups;
    }, {} as { [symbol: string]: Position[] });
  }

  private calculateRiskContribution(symbol: string, assetValue: number, portfolioValue: number): number {
    const weight = assetValue / portfolioValue;
    const volatility = this.estimateVolatility(symbol);
    return assetValue * weight * volatility * (Math.random() - 0.5) * 0.1; // Simplified risk contribution
  }

  private calculateCumulative(values: number[]): number[] {
    const cumulative = [values[0]];
    for (let i = 1; i < values.length; i++) {
      cumulative.push(cumulative[i-1] + values[i]);
    }
    return cumulative;
  }

  private generateRandomWeights(n: number): number[] {
    const weights = Array(n).fill(0).map(() => Math.random());
    const sum = weights.reduce((a, b) => a + b, 0);
    return weights.map(w => w / sum);
  }

  private getBasePrice(symbol: string): number {
    const prices: { [key: string]: number } = {
      'AAPL': 175, 'MSFT': 340, 'GOOGL': 125, 'TSLA': 250,
      'SPY': 425, 'QQQ': 360, 'BTC': 45000, 'ETH': 3000
    };
    return prices[symbol] || 100;
  }

  private calculateBlackScholesValue(S: number, K: number, T: number, r: number, sigma: number, type: 'call' | 'put'): number {
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    
    const Nd1 = this.normalCDF(d1);
    const Nd2 = this.normalCDF(d2);
    
    if (type === 'call') {
      return S * Nd1 - K * Math.exp(-r * T) * Nd2;
    } else {
      return K * Math.exp(-r * T) * this.normalCDF(-d2) - S * this.normalCDF(-d1);
    }
  }

  private normalCDF(x: number): number {
    return (1 + this.erf(x / Math.sqrt(2))) / 2;
  }

  private erf(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  getWaterfallConfig(data: WaterfallData): any {
    return {
      type: 'bar',
      data: {
        labels: data.categories,
        datasets: [{
          label: 'Risk Contribution',
          data: data.values,
          backgroundColor: data.colors,
          borderColor: data.colors.map(color => color.replace('0.8', '1')),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Risk Attribution Waterfall',
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const value = context.parsed.y;
                return `${context.label}: ${value > 0 ? '+' : ''}$${value.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Risk Components'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Value ($)'
            },
            beginAtZero: true
          }
        }
      }
    };
  }
}
