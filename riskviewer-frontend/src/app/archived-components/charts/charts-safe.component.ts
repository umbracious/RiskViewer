import { Component, Input, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Position } from '../services/position.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
    selector: 'app-charts-safe',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="charts-container">
            <h2>📈 Safe Charts Test</h2>
            <div *ngIf="!positions || positions.length === 0" class="no-data">
                <div class="no-data-icon">📊</div>
                <h3>No Portfolio Data Available</h3>
                <p>Connect to your trading system to view charts</p>
            </div>
            <div *ngIf="positions && positions.length > 0" class="charts-grid">
                
                <div class="chart-card">
                    <h3>🔥 Simple Test Chart</h3>
                    <div class="chart-wrapper">
                        <canvas #testChart></canvas>
                    </div>
                </div>

                <div class="chart-card">
                    <h3>🔧 Debug Info</h3>
                    <div class="status-info">
                        <p><strong>Chart.js:</strong> {{ chartJsLoaded ? '✅ Loaded' : '❌ Not Loaded' }}</p>
                        <p><strong>Charts Created:</strong> {{ chartsCount }}</p>
                        <p><strong>Data Points:</strong> {{ positions.length }}</p>
                        <p><strong>Last Error:</strong> {{ lastError || 'None' }}</p>
                        <button (click)="createTestChart()" class="test-btn">🧪 Create Test Chart</button>
                        <button (click)="destroyCharts()" class="destroy-btn">🗑️ Destroy Charts</button>
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

        .no-data {
            text-align: center;
            color: #6c757d;
            padding: 4rem 2rem;
        }

        .status-info {
            padding: 1rem;
            background: white;
            border-radius: 6px;
            border: 1px solid #ddd;
        }

        .status-info p {
            margin: 0.5rem 0;
            font-size: 0.9rem;
        }

        .test-btn, .destroy-btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            margin: 0.5rem 0.5rem 0 0;
        }

        .destroy-btn {
            background: #dc3545;
        }

        .test-btn:hover {
            background: #0056b3;
        }

        .destroy-btn:hover {
            background: #c82333;
        }
    `]
})
export class ChartsSafeComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() positions: Position[] = [];
    
    @ViewChild('testChart') testChartRef!: ElementRef<HTMLCanvasElement>;
    
    private charts: Chart[] = [];
    lastError: string | null = null;
    
    constructor() {}
    
    get chartJsLoaded(): boolean {
        return typeof Chart !== 'undefined';
    }
    
    get chartsCount(): number {
        return this.charts.length;
    }

    ngOnInit() {
        console.log('ChartsSafeComponent initialized with', this.positions?.length || 0, 'positions');
    }

    ngAfterViewInit() {
        console.log('ChartsSafeComponent AfterViewInit - Chart.js available:', this.chartJsLoaded);
        setTimeout(() => {
            if (this.positions && this.positions.length > 0) {
                this.createTestChart();
            }
        }, 1000);
    }

    ngOnDestroy() {
        this.destroyCharts();
    }

    createTestChart() {
        this.lastError = null;
        
        try {
            console.log('🧪 Creating test chart...');
            
            if (!this.testChartRef?.nativeElement) {
                throw new Error('Canvas element not available');
            }

            if (!this.chartJsLoaded) {
                throw new Error('Chart.js not loaded');
            }

            const canvas = this.testChartRef.nativeElement;
            
            // Simple test data
            const labels = ['A', 'B', 'C', 'D'];
            const data = [10, 20, 30, 40];
            
            const chart = new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Test Data',
                        data: data,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.8)',
                            'rgba(54, 162, 235, 0.8)',
                            'rgba(255, 205, 86, 0.8)',
                            'rgba(75, 192, 192, 0.8)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: { display: true, text: 'Simple Test Chart' }
                    }
                }
            });

            this.charts.push(chart);
            console.log('✅ Test chart created successfully');
            
        } catch (error) {
            this.lastError = error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Error creating test chart:', error);
        }
    }

    destroyCharts() {
        try {
            this.charts.forEach((chart, index) => {
                if (chart && typeof chart.destroy === 'function') {
                    chart.destroy();
                    console.log(`✅ Chart ${index + 1} destroyed`);
                }
            });
            this.charts = [];
            this.lastError = null;
            console.log('✅ All charts destroyed successfully');
        } catch (error) {
            this.lastError = error instanceof Error ? error.message : 'Error destroying charts';
            console.error('❌ Error destroying charts:', error);
            this.charts = [];
        }
    }
}
