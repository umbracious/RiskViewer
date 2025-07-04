import { Component, OnInit } from '@angular/core';
import { PortfolioOverview } from "./overview/overview";
import { ChartsComponent } from "./charts/charts.component";
import { PositionsTable } from "./positions-table/positions.table";
import { RiskDashboardComponent } from "./risk-dashboard/risk-dashboard.component";
import { AdvancedRiskAnalyticsComponent } from "./advanced-risk-analytics/advanced-risk-analytics.component";
import { RealTimeMonitoringComponent } from "./real-time-monitoring/real-time-monitoring.component";
import { StructuredProductsComponent } from "./structured-products/structured-products.component";
import { WorkflowCollaborationComponent } from "./workflow-collaboration/workflow-collaboration.component";
import { PortfolioLiveViewComponent } from "./portfolio-live-view/portfolio-live-view.component";
import { PositionService, Position } from './services/position.service';
import { CommonModule } from '@angular/common';
import { RealtimeDashboardComponent } from "./realtime-dashboard/realtime-dashboard.component";

@Component({
    selector: 'app-root',
    template: `
        <div class="app-container">
            <!-- Header -->
            <header class="header">
                <div class="logo-section">
                    <h1>🏦 RiskViewer</h1>
                    <span class="subtitle">Enterprise Risk Analytics Platform</span>
                </div>
                <div class="user-section">
                    <span class="user-info">Risk Analyst | RAMPP Team</span>
                    <div class="connection-status" [class.connected]="!loading && !error">
                        <div class="status-dot"></div>
                        {{ loading ? 'CONNECTING' : error ? 'ERROR' : 'LIVE' }}
                    </div>
                </div>
            </header>

            <!-- Navigation -->
            <nav class="navigation">
                <div class="nav-container">
                    <button 
                        class="nav-item" 
                        [class.active]="currentView === 'dashboard'"
                        (click)="setView('dashboard')"
                    >
                        📊 Dashboard
                    </button>
                    <button 
                        class="nav-item" 
                        [class.active]="currentView === 'portfolio'"
                        (click)="setView('portfolio')"
                    >
                        💼 Live Portfolio
                    </button>
                    <button 
                        class="nav-item" 
                        [class.active]="currentView === 'realtime'"
                        (click)="setView('realtime')"
                    >
                        🚀 Real-Time Dashboard
                    </button>
                    <button 
                        class="nav-item" 
                        [class.active]="currentView === 'monitoring'"
                        (click)="setView('monitoring')"
                    >
                        🔴 Live Monitoring
                    </button>
                    <button 
                        class="nav-item" 
                        [class.active]="currentView === 'structured-products'"
                        (click)="setView('structured-products')"
                    >
                        🏛️ Structured Products
                    </button>
                    <button 
                        class="nav-item" 
                        [class.active]="currentView === 'analytics'"
                        (click)="setView('analytics')"
                    >
                        📈 Advanced Analytics
                    </button>
                    <button 
                        class="nav-item" 
                        [class.active]="currentView === 'workflow'"
                        (click)="setView('workflow')"
                    >
                        🔄 Workflow
                    </button>
                </div>
            </nav>
            
            <!-- Loading State -->
            <div *ngIf="loading" class="loading">
                <div class="spinner"></div>
                <p>Connecting to Risk Analytics Engine...</p>
            </div>
            
            <!-- Error State -->
            <div *ngIf="error" class="error">
                <div class="error-icon">⚠️</div>
                <h3>Connection Error</h3>
                <p>{{ error }}</p>
                <button (click)="loadData()" class="retry-btn">Retry Connection</button>
            </div>
            
            <!-- Main Content -->
            <main *ngIf="!loading && !error" class="main-content">
                <!-- Dashboard View -->
                <div *ngIf="currentView === 'dashboard'" class="view-container">
                    <portfolio-overview [positions]="positions"></portfolio-overview>
                    <risk-dashboard [positions]="positions"></risk-dashboard>
                    <app-charts [positions]="positions"></app-charts>
                    <positions-table [positions]="positions"></positions-table>
                </div>

                <!-- Live Portfolio View -->
                <div *ngIf="currentView === 'portfolio'" class="view-container">
                    <app-portfolio-live-view></app-portfolio-live-view>
                </div>

                <!-- Real-Time Dashboard View -->
                <div *ngIf="currentView === 'realtime'" class="view-container">
                    <app-realtime-dashboard></app-realtime-dashboard>
                </div>

                <!-- Live Monitoring View -->
                <div *ngIf="currentView === 'monitoring'" class="view-container">
                    <app-real-time-monitoring></app-real-time-monitoring>
                </div>

                <!-- Structured Products View -->
                <div *ngIf="currentView === 'structured-products'" class="view-container">
                    <app-structured-products></app-structured-products>
                </div>

                <!-- Advanced Analytics View -->
                <div *ngIf="currentView === 'analytics'" class="view-container">
                    <advanced-risk-analytics [positions]="positions"></advanced-risk-analytics>
                    <div class="analytics-grid">
                        <app-charts [positions]="positions"></app-charts>
                        <positions-table [positions]="positions"></positions-table>
                    </div>
                </div>

                <!-- Workflow View -->
                <div *ngIf="currentView === 'workflow'" class="view-container">
                    <app-workflow-collaboration></app-workflow-collaboration>
                </div>
            </main>
        </div>
    `,
    styles: [`
        .app-container {
            min-height: 100vh;
            background: #f8f9fa;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .logo-section h1 {
            margin: 0;
            font-size: 1.8rem;
            font-weight: 700;
        }

        .subtitle {
            font-size: 0.9rem;
            opacity: 0.9;
            display: block;
            margin-top: 0.25rem;
        }

        .user-section {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .user-info {
            font-size: 0.9rem;
            opacity: 0.9;
        }

        .connection-status {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(255,255,255,0.2);
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
        }

        .connection-status.connected {
            background: rgba(40,167,69,0.8);
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: currentColor;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }

        .navigation {
            background: white;
            border-bottom: 1px solid #e9ecef;
            sticky: top;
            z-index: 100;
        }

        .nav-container {
            padding: 0 2rem;
            display: flex;
            gap: 0;
        }

        .nav-item {
            background: none;
            border: none;
            padding: 1rem 1.5rem;
            cursor: pointer;
            font-size: 0.95rem;
            font-weight: 500;
            color: #6c757d;
            transition: all 0.2s;
            border-bottom: 3px solid transparent;
        }

        .nav-item:hover {
            color: #495057;
            background: #f8f9fa;
        }

        .nav-item.active {
            color: #007bff;
            border-bottom-color: #007bff;
            background: #f8f9fa;
        }

        .main-content {
            padding: 2rem;
        }

        .view-container {
            max-width: 1400px;
            margin: 0 auto;
        }

        .analytics-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin-top: 2rem;
        }

        .loading {
            text-align: center;
            padding: 4rem 2rem;
            background: white;
            margin: 2rem;
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #007bff;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .loading p {
            color: #6c757d;
            font-size: 1.1rem;
            margin: 0;
        }

        .error {
            text-align: center;
            padding: 4rem 2rem;
            background: white;
            margin: 2rem;
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-left: 4px solid #dc3545;
        }

        .error-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }

        .error h3 {
            color: #dc3545;
            margin: 0 0 1rem 0;
        }

        .error p {
            color: #6c757d;
            margin-bottom: 2rem;
        }

        .retry-btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 0.75rem 2rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 600;
            transition: background 0.2s;
        }

        .retry-btn:hover {
            background: #0056b3;
        }

        @media (max-width: 768px) {
            .header {
                flex-direction: column;
                gap: 1rem;
                text-align: center;
            }

            .nav-container {
                flex-direction: column;
                padding: 0;
            }

            .nav-item {
                text-align: center;
                border-bottom: 1px solid #e9ecef;
                border-right: none;
            }

            .analytics-grid {
                grid-template-columns: 1fr;
            }

            .main-content {
                padding: 1rem;
            }
        }
    `],
    imports: [
        PortfolioOverview, 
        ChartsComponent, 
        PositionsTable, 
        RiskDashboardComponent, 
        AdvancedRiskAnalyticsComponent,
        RealTimeMonitoringComponent,
        RealtimeDashboardComponent,
        PortfolioLiveViewComponent,
        StructuredProductsComponent,
        WorkflowCollaborationComponent,
        CommonModule
    ]
})
export class AppComponent implements OnInit {
    positions: Position[] = [];
    loading = true;
    error: string | null = null;
    currentView = 'dashboard';

    constructor(
        private positionService: PositionService
    ) {}

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.loading = true;
        this.error = null;
        
        this.positionService.getAllPositions().subscribe({
            next: (positions) => {
                this.positions = positions;
                this.loading = false;
                console.log('✅ Connected to Risk Analytics Engine - Loaded positions:', positions.length);
            },
            error: (err) => {
                // If backend is not available, use sample data for testing market integration
                console.warn('Backend not available, using sample data for market testing:', err);
                this.positions = this.getSamplePositions();
                this.loading = false;
                console.log('📊 Using sample positions for market data testing:', this.positions.length);
            }
        });
    }

    private getSamplePositions(): Position[] {
        return [
            {
                id: 1,
                symbol: 'AAPL',
                type: 'STOCK',
                quantity: 100,
                purchasePrice: 195.75, // Bought when it was lower
                portfolioId: 1,
                createdAt: '2024-01-15T10:30:00Z'
            },
            {
                id: 2,
                symbol: 'GOOGL',
                type: 'STOCK',
                quantity: 50,
                purchasePrice: 165.40, // Bought when it was higher
                portfolioId: 1,
                createdAt: '2024-01-16T14:20:00Z'
            },
            {
                id: 3,
                symbol: 'MSFT',
                type: 'STOCK',
                quantity: 75,
                purchasePrice: 420.85, // Bought lower
                portfolioId: 1,
                createdAt: '2024-01-17T09:15:00Z'
            },
            {
                id: 4,
                symbol: 'TSLA',
                type: 'STOCK',
                quantity: 30,
                purchasePrice: 245.50, // Bought lower
                portfolioId: 1,
                createdAt: '2024-01-18T11:45:00Z'
            },
            {
                id: 5,
                symbol: 'NVDA',
                type: 'STOCK',
                quantity: 200, // More shares due to stock split
                purchasePrice: 118.20, // Pre-split adjusted
                portfolioId: 1,
                createdAt: '2024-01-19T16:30:00Z'
            },
            {
                id: 6,
                symbol: 'AMD',
                type: 'STOCK',
                quantity: 80,
                purchasePrice: 142.30, // Bought lower
                portfolioId: 1,
                createdAt: '2024-01-20T13:10:00Z'
            }
        ];
    }

    setView(view: string) {
        this.currentView = view;
    }
}
