import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges, ElementRef, ViewChild, AfterViewInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Position } from "../services/position.service";
import { EnhancedVisualizationService, HeatmapData, CorrelationMatrix } from "../services/enhanced-visualization.service";

declare var Chart: any;
declare var Plotly: any;

@Component({
  selector: "charts",
  template: `
    <div class="charts-container">
      <h2>📈 Enhanced Risk Analytics Charts</h2>
      <div *ngIf="!positions || positions.length === 0" class="no-data">
        <div class="no-data-icon">📊</div>
        <h3>No Portfolio Data Available</h3>
        <p>Connect to your trading system to view advanced risk analytics</p>
      </div>
      <div *ngIf="positions && positions.length > 0" class="charts-grid">
        
        <!-- Portfolio Allocation Pie Chart -->
        <div class="chart-card">
          <h3>🥧 Portfolio Allocation</h3>
          <div class="chart-wrapper">
            <canvas #allocationChart width="400" height="300"></canvas>
          </div>
        </div>

        <!-- Risk Heatmap -->
        <div class="chart-card">
          <h3>🔥 Risk Concentration Heatmap</h3>
          <div class="chart-wrapper">
            <canvas #heatmapChart width="400" height="300"></canvas>
          </div>
        </div>

        <!-- Correlation Matrix -->
        <div class="chart-card">
          <h3>🔗 Asset Correlation Matrix</h3>
          <div class="chart-wrapper">
            <canvas #correlationChart width="400" height="300"></canvas>
          </div>
        </div>

        <!-- VaR Distribution -->
        <div class="chart-card">
          <h3>📉 Value at Risk Distribution</h3>
          <div class="chart-wrapper">
            <canvas #varChart width="400" height="300"></canvas>
          </div>
        </div>

        <!-- 3D Risk Surface -->
        <div class="chart-card full-width">
          <h3>🏔️ 3D Options Risk Surface</h3>
          <div class="chart-wrapper">
            <div #riskSurface style="width: 100%; height: 400px;"></div>
          </div>
        </div>

        <!-- Risk Waterfall -->
        <div class="chart-card full-width">
          <h3>💧 Risk Attribution Waterfall</h3>
          <div class="chart-wrapper">
            <canvas #waterfallChart width="800" height="400"></canvas>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .charts-container {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }

    .charts-container h2 {
      color: #2c3e50;
      margin-bottom: 2rem;
      font-weight: 600;
      text-align: center;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
      margin-top: 1.5rem;
    }

    .chart-card {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 1.5rem;
      border: 1px solid #dee2e6;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .chart-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0,0,0,0.15);
    }

    .chart-card.full-width {
      grid-column: 1 / -1;
    }

    .chart-card h3 {
      color: #495057;
      margin-bottom: 1rem;
      font-size: 1.1rem;
      font-weight: 600;
      border-bottom: 2px solid #007bff;
      padding-bottom: 0.5rem;
    }

    .chart-wrapper {
      position: relative;
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chart-card.full-width .chart-wrapper {
      height: 400px;
    }

    .no-data {
      text-align: center;
      color: #6c757d;
      padding: 4rem 2rem;
    }

    .no-data-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .no-data h3 {
      color: #495057;
      margin-bottom: 1rem;
    }

    .no-data p {
      color: #6c757d;
      font-size: 1.1rem;
    }

    canvas {
      max-width: 100%;
      max-height: 100%;
    }

    @media (max-width: 768px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
      
      .charts-container {
        padding: 1rem;
      }
    }
  `],
  imports: [CommonModule],
  standalone: true
})
export class Charts implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() positions: Position[] = [];

  @ViewChild('allocationChart') allocationChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('heatmapChart') heatmapChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('correlationChart') correlationChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('varChart') varChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('waterfallChart') waterfallChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('riskSurface') riskSurfaceRef!: ElementRef<HTMLDivElement>;

  private charts: any[] = [];
  private heatmapData: HeatmapData[] = [];
  private correlationMatrix: CorrelationMatrix | null = null;

  constructor(private visualizationService: EnhancedVisualizationService) {}

  ngOnInit() {
    this.generateChartData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['positions'] && !changes['positions'].firstChange) {
      this.generateChartData();
      this.updateCharts();
    }
  }

  ngAfterViewInit() {
    // Delay chart creation to ensure DOM is ready
    setTimeout(() => {
      this.createCharts();
    }, 100);
  }

  private generateChartData() {
    if (this.positions && this.positions.length > 0) {
      this.heatmapData = this.visualizationService.generateRiskHeatmap(this.positions);
      this.correlationMatrix = this.visualizationService.generateCorrelationMatrix(this.positions);
    }
  }

  private createCharts() {
    if (!this.positions || this.positions.length === 0) return;

    this.destroyCharts();

    try {
      this.createAllocationChart();
      this.createHeatmapChart();
      this.createCorrelationChart();
      this.createVaRChart();
      this.createRiskSurface();
      this.createWaterfallChart();
    } catch (error) {
      console.error('Error creating charts:', error);
    }
  }

  private createAllocationChart() {
    if (!this.allocationChartRef?.nativeElement) return;

    const labels = this.positions.map(p => p.symbol);
    const values = this.positions.map(p => p.quantity * p.purchasePrice);
    const config = this.visualizationService.getPortfolioAllocationConfig(labels, values);

    const chart = new Chart(this.allocationChartRef.nativeElement, config);
    this.charts.push(chart);
  }

  private createHeatmapChart() {
    if (!this.heatmapChartRef?.nativeElement || !this.heatmapData.length) return;

    const ctx = this.heatmapChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Risk vs Return',
          data: this.heatmapData.map(d => ({
            x: d.return,
            y: d.risk,
            r: Math.sqrt(d.weight) * 10
          })),
          backgroundColor: this.heatmapData.map(d => d.color),
          borderColor: this.heatmapData.map(d => d.color),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Risk-Return Heatmap',
            font: { size: 14, weight: 'bold' }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const point = this.heatmapData[context.dataIndex];
                return [
                  `Asset: ${point.asset}`,
                  `Risk: ${point.risk.toFixed(2)}%`,
                  `Return: ${point.return.toFixed(2)}%`,
                  `Weight: ${point.weight.toFixed(1)}%`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Expected Return (%)'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Risk Score'
            }
          }
        }
      }
    });

    this.charts.push(chart);
  }

  private createCorrelationChart() {
    if (!this.correlationChartRef?.nativeElement || !this.correlationMatrix) return;

    const config = this.visualizationService.getCorrelationHeatmapConfig(this.correlationMatrix);
    const chart = new Chart(this.correlationChartRef.nativeElement, config);
    this.charts.push(chart);
  }

  private createVaRChart() {
    if (!this.varChartRef?.nativeElement) return;

    // Generate sample VaR distribution
    const returns = Array.from({length: 1000}, () => (Math.random() - 0.5) * 0.1);
    const var95 = returns.sort((a, b) => a - b)[Math.floor(returns.length * 0.05)];
    
    const config = this.visualizationService.getVaRDistributionConfig(returns, var95);
    const chart = new Chart(this.varChartRef.nativeElement, config);
    this.charts.push(chart);
  }

  private createRiskSurface() {
    if (!this.riskSurfaceRef?.nativeElement || typeof Plotly === 'undefined') {
      console.warn('Plotly not available for 3D surface chart');
      return;
    }

    const surfaceData = this.visualizationService.generateRiskSurface(100);
    
    const data = [{
      z: surfaceData.z,
      x: surfaceData.x,
      y: surfaceData.y,
      type: 'surface',
      colorscale: 'Viridis',
      showscale: true
    }];

    const layout = {
      title: '3D Options Risk Surface',
      scene: {
        xaxis: { title: 'Strike Price' },
        yaxis: { title: 'Time to Expiry' },
        zaxis: { title: 'Option Value' }
      },
      margin: { t: 50, b: 50, l: 50, r: 50 }
    };

    Plotly.newPlot(this.riskSurfaceRef.nativeElement, data, layout, {responsive: true});
  }

  private createWaterfallChart() {
    if (!this.waterfallChartRef?.nativeElement) return;

    const waterfallData = this.visualizationService.generateRiskWaterfall(this.positions);
    const config = this.visualizationService.getWaterfallConfig(waterfallData);
    
    const chart = new Chart(this.waterfallChartRef.nativeElement, config);
    this.charts.push(chart);
  }

  private updateCharts() {
    if (this.charts.length > 0) {
      setTimeout(() => {
        this.createCharts();
      }, 100);
    }
  }

  private destroyCharts() {
    this.charts.forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    this.charts = [];
  }

  ngOnDestroy() {
    this.destroyCharts();
  }
}
