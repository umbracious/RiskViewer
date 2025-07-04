import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Position } from '../services/position.service';
import { MarketDataService, MarketData } from '../services/market-data.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-charts',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="charts-container">
            <div class="dashboard-header">
                <h2>📈 Risk Analytics Dashboard</h2>
                <div class="market-status">
                    <div class="status-indicator" [class.live]="isMarketDataLive()"></div>
                    <div class="status-info">
                        <span class="status-text">{{ getMarketStatusText() }}</span>
                        <span class="last-updated">{{ formatTime(lastUpdated) }}</span>
                    </div>
                </div>
            </div>
            <div *ngIf="!positions || positions.length === 0" class="no-data">
                <div class="no-data-icon">📊</div>
                <h3>No Portfolio Data Available</h3>
                <p>Connect to your trading system to view real-time analytics</p>
            </div>
            <div *ngIf="positions && positions.length > 0" class="charts-grid">
                
                <!-- Portfolio Summary Cards -->
                <div class="chart-card summary-grid">
                    <h3>💼 Portfolio Summary</h3>
                    <div class="summary-cards">
                        <div class="summary-card">
                            <div class="card-icon">💰</div>
                            <div class="card-content">
                                <div class="card-value">{{ formatCurrency(getTotalValue()) }}</div>
                                <div class="card-label">Total Value</div>
                            </div>
                        </div>
                        <div class="summary-card">
                            <div class="card-icon">📈</div>
                            <div class="card-content">
                                <div class="card-value">{{ formatCurrency(getTotalPnL()) }}</div>
                                <div class="card-label">Total P&L</div>
                            </div>
                        </div>
                        <div class="summary-card">
                            <div class="card-icon">🎯</div>
                            <div class="card-content">
                                <div class="card-value">{{ positions.length }}</div>
                                <div class="card-label">Positions</div>
                            </div>
                        </div>
                        <div class="summary-card">
                            <div class="card-icon">⚡</div>
                            <div class="card-content">
                                <div class="card-value">{{ getRiskScore() }}</div>
                                <div class="card-label">Risk Score</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Top Holdings -->
                <div class="chart-card">
                    <h3>🔝 Top Holdings</h3>
                    <div class="holdings-list">
                        <div *ngFor="let position of getTopHoldings(); let i = index" class="holding-item">
                            <div class="holding-rank">{{ i + 1 }}</div>
                            <div class="holding-info">
                                <div class="holding-header">
                                    <div class="holding-symbol">{{ position.symbol }}</div>
                                    <div class="holding-price" [class]="getPriceChangeClass(position)">
                                        {{ formatCurrency(getCurrentPrice(position)) }}
                                        <span *ngIf="marketData.get(position.symbol) as market" class="price-change">
                                            ({{ market.change >= 0 ? '+' : '' }}{{ formatCurrency(market.change) }})
                                        </span>
                                    </div>
                                </div>
                                <div class="holding-details">
                                    {{ position.quantity }} shares • Cost: {{ formatCurrency(position.purchasePrice) }}
                                </div>
                            </div>
                            <div class="holding-value-section">
                                <div class="holding-value">{{ formatCurrency(getMarketValue(position)) }}</div>
                                <div class="holding-pnl" [class]="getPnLClass(position)">
                                    {{ formatCurrency(getPositionPnL(position)) }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Asset Allocation Pie Chart -->
                <div class="chart-card">
                    <h3>📊 Asset Allocation</h3>
                    <div class="allocation-chart-container">
                        <div class="pie-chart-wrapper">
                            <svg class="pie-chart" viewBox="0 0 200 200">
                                <g *ngFor="let slice of getPieSlices(); let i = index">
                                    <path [attr.d]="slice.path" 
                                          [attr.fill]="getColor(i)"
                                          [attr.stroke]="'white'"
                                          [attr.stroke-width]="2"
                                          class="pie-slice">
                                    </path>
                                </g>
                            </svg>
                        </div>
                        <div class="pie-legend">
                            <div *ngFor="let position of positions; let i = index" class="legend-item">
                                <div class="legend-color" [style.background-color]="getColor(i)"></div>
                                <div class="legend-text">
                                    <span class="legend-symbol">{{ position.symbol }}</span>
                                    <span class="legend-percentage">{{ getAllocationPercentage(position) | number:'1.1-1' }}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Risk Metrics -->
                <div class="chart-card">
                    <h3>⚠️ Risk Metrics</h3>
                    <div class="risk-metrics">
                        <div class="metric-item">
                            <div class="metric-label">Value at Risk (95%)</div>
                            <div class="metric-value risk-high">{{ formatCurrency(getValueAtRisk()) }}</div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-label">Maximum Drawdown</div>
                            <div class="metric-value risk-medium">{{ getMaxDrawdown() }}%</div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-label">Beta</div>
                            <div class="metric-value risk-low">{{ getBeta() }}</div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-label">Sharpe Ratio</div>
                            <div class="metric-value risk-good">{{ getSharpeRatio() }}</div>
                        </div>
                    </div>
                </div>

                <!-- Position Details -->
                <div class="chart-card positions-table">
                    <h3>📋 Position Details</h3>
                    <div class="table-wrapper">
                        <table class="positions-table">
                            <thead>
                                <tr>
                                    <th>Symbol</th>
                                    <th>Quantity</th>
                                    <th>Cost Basis</th>
                                    <th>Current Price</th>
                                    <th>Market Value</th>
                                    <th>P&L</th>
                                    <th>Allocation</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let position of positions; let i = index">
                                    <td class="symbol-cell">
                                        <div class="symbol-indicator" [style.background-color]="getColor(i)"></div>
                                        <div class="symbol-info">
                                            <div class="symbol-name">{{ position.symbol }}</div>
                                            <div *ngIf="marketData.get(position.symbol) as market" 
                                                 class="symbol-change" [class]="getPriceChangeClass(position)">
                                                {{ market.changePercent >= 0 ? '+' : '' }}{{ market.changePercent | number:'1.2-2' }}%
                                            </div>
                                        </div>
                                    </td>
                                    <td>{{ position.quantity | number:'1.0-0' }}</td>
                                    <td>{{ formatCurrency(position.purchasePrice) }}</td>
                                    <td [class]="getPriceChangeClass(position)">{{ formatCurrency(getCurrentPrice(position)) }}</td>
                                    <td>{{ formatCurrency(getMarketValue(position)) }}</td>
                                    <td [class]="getPnLClass(position)">{{ formatCurrency(getPositionPnL(position)) }}</td>
                                    <td>{{ getAllocationPercentage(position) | number:'1.1-1' }}%</td>
                                </tr>
                            </tbody>
                        </table>
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

        .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }

        .dashboard-header h2 {
            margin: 0;
        }

        .market-status {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 0.85rem;
        }

        .status-info {
            display: flex;
            flex-direction: column;
            gap: 0.2rem;
        }

        .status-indicator {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #dc3545;
            animation: pulse 2s infinite;
            flex-shrink: 0;
        }

        .status-indicator.live {
            background: #28a745;
        }

        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }

        .status-text {
            font-weight: 600;
            color: #333;
        }

        .last-updated {
            color: #666;
            font-size: 0.8rem;
        }

        .no-data {
            text-align: center;
            padding: 4rem 2rem;
            color: #666;
        }

        .no-data-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }

        .charts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
        }

        .chart-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 1.5rem;
            border: 1px solid #e9ecef;
        }

        .chart-card h3 {
            margin: 0 0 1rem 0;
            color: #333;
            font-size: 1.1rem;
            font-weight: 600;
        }

        /* Summary Cards */
        .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
        }

        .summary-card {
            background: white;
            border-radius: 8px;
            padding: 1rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            border: 1px solid #e9ecef;
        }

        .card-icon {
            font-size: 2rem;
        }

        .card-value {
            font-size: 1.2rem;
            font-weight: bold;
            color: #333;
        }

        .card-label {
            font-size: 0.85rem;
            color: #666;
        }

        /* Holdings */
        .holdings-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .holding-item {
            display: flex;
            align-items: center;
            padding: 0.75rem;
            background: white;
            border-radius: 6px;
            border: 1px solid #e9ecef;
        }

        .holding-rank {
            width: 30px;
            height: 30px;
            background: #007bff;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 0.85rem;
        }

        .holding-info {
            flex: 1;
            margin-left: 1rem;
        }

        .holding-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.25rem;
        }

        .holding-symbol {
            font-weight: bold;
            color: #333;
        }

        .holding-price {
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }

        .price-change {
            font-size: 0.8rem;
        }

        .holding-details {
            font-size: 0.85rem;
            color: #666;
        }

        .holding-value-section {
            text-align: right;
        }

        .holding-value {
            font-weight: bold;
            color: #333;
            margin-bottom: 0.25rem;
        }

        .holding-pnl {
            font-size: 0.85rem;
            font-weight: 600;
        }

        /* Pie Chart */
        .allocation-chart-container {
            display: flex;
            gap: 2rem;
            align-items: flex-start;
        }

        .pie-chart-wrapper {
            flex: 0 0 200px;
        }

        .pie-chart {
            width: 100%;
            height: auto;
            max-width: 200px;
        }

        .pie-slice {
            transition: opacity 0.2s;
            cursor: pointer;
        }

        .pie-slice:hover {
            opacity: 0.8;
        }

        .pie-legend {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.5rem;
            background: white;
            border-radius: 4px;
            border: 1px solid #e9ecef;
        }

        .legend-color {
            width: 16px;
            height: 16px;
            border-radius: 3px;
            flex-shrink: 0;
        }

        .legend-text {
            display: flex;
            justify-content: space-between;
            width: 100%;
        }

        .legend-symbol {
            font-weight: bold;
            color: #333;
        }

        .legend-percentage {
            color: #666;
        }

        /* Risk Metrics */
        .risk-metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        }

        .metric-item {
            background: white;
            padding: 1rem;
            border-radius: 6px;
            border: 1px solid #e9ecef;
        }

        .metric-label {
            font-size: 0.85rem;
            color: #666;
            margin-bottom: 0.5rem;
        }

        .metric-value {
            font-size: 1.2rem;
            font-weight: bold;
        }

        .risk-high { color: #dc3545; }
        .risk-medium { color: #ffc107; }
        .risk-low { color: #17a2b8; }
        .risk-good { color: #28a745; }

        /* Positions Table */
        .positions-table {
            grid-column: 1 / -1;
        }

        .table-wrapper {
            overflow-x: auto;
        }

        .positions-table table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 6px;
            overflow: hidden;
            border: 1px solid #e9ecef;
        }

        .positions-table th,
        .positions-table td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }

        .positions-table th {
            background: #f8f9fa;
            font-weight: 600;
            color: #333;
            font-size: 0.85rem;
            text-transform: uppercase;
        }

        .symbol-cell {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .symbol-info {
            display: flex;
            flex-direction: column;
        }

        .symbol-name {
            font-weight: bold;
        }

        .symbol-change {
            font-size: 0.75rem;
            font-weight: 600;
        }

        .symbol-indicator {
            width: 12px;
            height: 12px;
            border-radius: 2px;
            flex-shrink: 0;
        }

        .pnl-positive, .price-up { color: #28a745; }
        .pnl-negative, .price-down { color: #dc3545; }
        .pnl-neutral, .price-neutral { color: #666; }

        @media (max-width: 768px) {
            .charts-grid {
                grid-template-columns: 1fr;
            }
            
            .allocation-chart-container {
                flex-direction: column;
                align-items: center;
            }
            
            .pie-chart-wrapper {
                flex: none;
            }
        }
    `]
})
export class ChartsComponent implements OnInit, OnDestroy {
    @Input() positions: Position[] = [];
    
    marketData = new Map<string, MarketData>();
    portfolioMetrics: any = {};
    lastUpdated: Date = new Date();
    private marketDataSubscription?: Subscription;

    // Real-time chart data
    private realTimeData: MarketData[] = [];
    private chartUpdateInterval: any;

    // Enhanced market status tracking
    private isLive = false;
    private marketStatusInfo = { isOpen: false, status: 'Loading...' };

    private colors = [
        '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
        '#9b59b6', '#1abc9c', '#34495e', '#e67e22',
        '#95a5a6', '#f1c40f'
    ];

    constructor(private marketDataService: MarketDataService) {}

    ngOnInit() {
        this.initializeMarketData();
    }

    ngOnDestroy() {
        if (this.marketDataSubscription) {
            this.marketDataSubscription.unsubscribe();
        }
    }

    private initializeMarketData() {
        // Track all symbols from positions
        this.positions.forEach(position => {
            this.marketDataService.trackSymbol(position.symbol);
        });

        // Subscribe to market data updates
        this.marketDataSubscription = this.marketDataService.marketData$.subscribe(data => {
            this.marketData = data;
            this.portfolioMetrics = this.marketDataService.calculatePortfolioMetrics(this.positions, data);
            this.lastUpdated = new Date();
        });
    }

    // Utility Methods
    formatCurrency(value: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    formatTime(date: Date): string {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    getColor(index: number): string {
        return this.colors[index % this.colors.length];
    }

    isMarketDataLive(): boolean {
        // Check if market is open and data is recent
        const isMarketOpen = this.marketDataService.isMarketOpen();
        const now = new Date();
        const diffMinutes = (now.getTime() - this.lastUpdated.getTime()) / (1000 * 60);
        
        // If market is closed, we don't expect live updates
        if (!isMarketOpen) {
            return diffMinutes < 10; // Consider "live" if updated within 10 minutes when closed
        }
        
        // During market hours, expect frequent updates
        return diffMinutes < 2;
    }

    getMarketStatusText(): string {
        return this.marketDataService.getMarketStatus();
    }

    // Portfolio Summary Methods
    getTotalValue(): number {
        if (this.portfolioMetrics.totalValue) {
            return this.portfolioMetrics.totalValue;
        }
        // Fallback to original calculation
        return this.positions.reduce((total, pos) => total + (pos.quantity * pos.purchasePrice), 0);
    }

    getTotalPnL(): number {
        if (this.portfolioMetrics.totalPnL !== undefined) {
            return this.portfolioMetrics.totalPnL;
        }
        // Fallback to original calculation
        return this.positions.reduce((total, pos) => total + this.getPositionPnL(pos), 0);
    }

    getPositionPnL(position: Position): number {
        const marketData = this.marketData.get(position.symbol);
        if (marketData) {
            const currentValue = position.quantity * marketData.currentPrice;
            const costBasis = position.quantity * position.purchasePrice;
            return currentValue - costBasis;
        }
        // Fallback: Simple P&L calculation (assuming cost basis of 90% of current purchasePrice)
        const costBasis = position.purchasePrice * 0.9;
        return (position.purchasePrice - costBasis) * position.quantity;
    }

    getCurrentPrice(position: Position): number {
        const marketData = this.marketData.get(position.symbol);
        return marketData?.currentPrice || position.purchasePrice;
    }

    getMarketValue(position: Position): number {
        return position.quantity * this.getCurrentPrice(position);
    }

    getPnLClass(position: Position): string {
        const pnl = this.getPositionPnL(position);
        if (pnl > 0) return 'pnl-positive';
        if (pnl < 0) return 'pnl-negative';
        return 'pnl-neutral';
    }

    getPriceChangeClass(position: Position): string {
        const marketData = this.marketData.get(position.symbol);
        if (marketData) {
            if (marketData.change > 0) return 'price-up';
            if (marketData.change < 0) return 'price-down';
        }
        return 'price-neutral';
    }

    getRiskScore(): string {
        const totalValue = this.getTotalValue();
        const concentration = Math.max(...this.positions.map(p => this.getAllocationPercentage(p)));
        
        if (concentration > 50 || totalValue > 1000000) return 'High';
        if (concentration > 30 || totalValue > 500000) return 'Medium';
        return 'Low';
    }

    // Holdings Methods
    getTopHoldings(): Position[] {
        return this.positions
            .sort((a, b) => this.getMarketValue(b) - this.getMarketValue(a))
            .slice(0, 5);
    }

    // Allocation Methods
    getAllocationPercentage(position: Position): number {
        const totalValue = this.getTotalValue();
        const positionValue = this.getMarketValue(position);
        return totalValue > 0 ? (positionValue / totalValue) * 100 : 0;
    }

    // Pie Chart Methods
    getPieSlices(): Array<{path: string, percentage: number}> {
        const totalValue = this.getTotalValue();
        let currentAngle = 0;
        
        return this.positions.map(position => {
            const percentage = this.getAllocationPercentage(position);
            const angle = (percentage / 100) * 360;
            
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            
            const path = this.createArcPath(100, 100, 80, startAngle, endAngle);
            
            currentAngle += angle;
            
            return { path, percentage };
        });
    }

    private createArcPath(centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number): string {
        const start = this.polarToCartesian(centerX, centerY, radius, endAngle);
        const end = this.polarToCartesian(centerX, centerY, radius, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        
        return [
            "M", centerX, centerY,
            "L", start.x, start.y,
            "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
            "Z"
        ].join(" ");
    }

    private polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    }

    // Risk Metrics Methods
    getValueAtRisk(): number {
        // Simple VaR calculation (5% of total portfolio value)
        return this.getTotalValue() * 0.05;
    }

    getMaxDrawdown(): number {
        // Simulated max drawdown percentage
        return Math.round(Math.random() * 15 + 5);
    }

    getBeta(): string {
        // Simulated beta value
        return (Math.random() * 0.8 + 0.6).toFixed(2);
    }

    getSharpeRatio(): string {
        // Simulated Sharpe ratio
        return (Math.random() * 1.5 + 0.5).toFixed(2);
    }
}