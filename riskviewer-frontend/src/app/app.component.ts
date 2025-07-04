import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainDashboardComponent } from './main-dashboard/main-dashboard.component';
import { AdvancedRiskAnalyticsComponent } from './advanced-risk-analytics/advanced-risk-analytics.component';
import { StructuredProductsComponent } from './structured-products/structured-products.component';
import { PositionService, Position } from './services/position.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        CommonModule,
        MainDashboardComponent,
        AdvancedRiskAnalyticsComponent,
        StructuredProductsComponent
    ],
    template: `
        <div class="app-container">
            <!-- Modern Header -->
            <header class="modern-header">
                <div class="header-content">
                    <div class="brand">
                        <div class="logo">🏦</div>
                        <div class="brand-text">
                            <h1>RiskViewer</h1>
                            <span class="tagline">Enterprise Risk Analytics</span>
                        </div>
                    </div>
                    
                    <nav class="main-nav">
                        <button 
                            class="nav-btn" 
                            [class.active]="currentView === 'dashboard'"
                            (click)="setView('dashboard')"
                        >
                            📊 Dashboard
                        </button>
                        <button 
                            class="nav-btn" 
                            [class.active]="currentView === 'analytics'"
                            (click)="setView('analytics')"
                        >
                            🧮 Analytics
                        </button>
                        <button 
                            class="nav-btn" 
                            [class.active]="currentView === 'products'"
                            (click)="setView('products')"
                        >
                            🏛️ Products
                        </button>
                    </nav>

                    <div class="user-section">
                        <div class="connection-status" [class.connected]="!loading && !error">
                            <div class="status-dot"></div>
                            {{ loading ? 'CONNECTING' : error ? 'ERROR' : 'LIVE' }}
                        </div>
                        <div class="user-info">
                            <span class="user-name">Risk Analyst</span>
                        </div>
                    </div>
                </div>
            </header>
            
            <!-- Loading State -->
            <div *ngIf="loading" class="loading-screen">
                <div class="loading-content">
                    <div class="spinner"></div>
                    <h3>Connecting to Risk Analytics Engine</h3>
                    <p>Please wait while we load your portfolio data...</p>
                </div>
            </div>
            
            <!-- Error State -->
            <div *ngIf="error" class="error-screen">
                <div class="error-content">
                    <div class="error-icon">⚠️</div>
                    <h3>Connection Error</h3>
                    <p>{{ error }}</p>
                    <button (click)="loadData()" class="retry-btn">
                        🔄 Retry Connection
                    </button>
                </div>
            </div>
            
            <!-- Main Content -->
            <main *ngIf="!loading && !error" class="main-content">
                <!-- Dashboard View -->
                <app-main-dashboard *ngIf="currentView === 'dashboard'"></app-main-dashboard>

                <!-- Advanced Analytics View -->
                <div *ngIf="currentView === 'analytics'" class="view-container">
                    <advanced-risk-analytics [positions]="positions"></advanced-risk-analytics>
                </div>

                <!-- Structured Products View -->
                <div *ngIf="currentView === 'products'" class="view-container">
                    <app-structured-products></app-structured-products>
                </div>
            </main>
        </div>
    `,
    styles: [`
        .app-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }

        .modern-header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 24px;
            max-width: 1400px;
            margin: 0 auto;
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .logo {
            font-size: 32px;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }

        .brand-text h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .tagline {
            font-size: 12px;
            color: #64748b;
            font-weight: 500;
        }

        .main-nav {
            display: flex;
            gap: 8px;
            background: rgba(248, 250, 252, 0.8);
            padding: 4px;
            border-radius: 12px;
            backdrop-filter: blur(10px);
        }

        .nav-btn {
            padding: 12px 20px;
            border: none;
            background: transparent;
            border-radius: 8px;
            font-weight: 500;
            color: #64748b;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
        }

        .nav-btn:hover {
            color: #1e293b;
            background: rgba(255, 255, 255, 0.7);
        }

        .nav-btn.active {
            color: #1e293b;
            background: white;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .user-section {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .connection-status {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: rgba(239, 68, 68, 0.1);
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            color: #dc2626;
            transition: all 0.3s;
        }

        .connection-status.connected {
            background: rgba(16, 185, 129, 0.1);
            color: #059669;
        }

        .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: currentColor;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .user-info {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }

        .user-name {
            font-weight: 600;
            color: #1e293b;
            font-size: 14px;
        }

        .user-role {
            font-size: 12px;
            color: #64748b;
        }

        .loading-screen, .error-screen {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: calc(100vh - 80px);
            padding: 40px;
        }

        .loading-content, .error-content {
            text-align: center;
            background: white;
            padding: 48px;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            max-width: 400px;
        }

        .spinner {
            width: 48px;
            height: 48px;
            border: 4px solid #f1f5f9;
            border-top: 4px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 24px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .loading-content h3, .error-content h3 {
            margin: 0 0 12px 0;
            color: #1e293b;
            font-size: 20px;
            font-weight: 600;
        }

        .loading-content p, .error-content p {
            margin: 0 0 24px 0;
            color: #64748b;
            line-height: 1.5;
        }

        .error-icon {
            font-size: 48px;
            margin-bottom: 24px;
        }

        .retry-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }

        .retry-btn:hover {
            transform: translateY(-1px);
        }

        .main-content {
            min-height: calc(100vh - 80px);
        }

        .view-container {
            padding: 24px;
            max-width: 1400px;
            margin: 0 auto;
        }

        @media (max-width: 768px) {
            .header-content {
                flex-direction: column;
                gap: 16px;
            }

            .main-nav {
                order: -1;
                width: 100%;
                justify-content: center;
            }

            .nav-btn {
                flex: 1;
                text-align: center;
            }

            .user-section {
                width: 100%;
                justify-content: space-between;
            }

            .view-container {
                padding: 16px;
            }
        }
    `]
})
export class AppComponent implements OnInit {
    positions: Position[] = [];
    loading = true;
    error: string | null = null;
    currentView = 'dashboard';

    constructor(private positionService: PositionService) {}

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
                purchasePrice: 195.50,
                portfolioId: 1,
                createdAt: '2024-01-15T10:30:00Z'
            },
            {
                id: 2,
                symbol: 'GOOGL',
                type: 'STOCK',
                quantity: 50,
                purchasePrice: 165.80,
                portfolioId: 1,
                createdAt: '2024-01-16T14:15:00Z'
            },
            {
                id: 3,
                symbol: 'MSFT',
                type: 'STOCK',
                quantity: 75,
                purchasePrice: 415.25,
                portfolioId: 1,
                createdAt: '2024-01-17T09:45:00Z'
            },
            {
                id: 4,
                symbol: 'TSLA',
                type: 'STOCK',
                quantity: 25,
                purchasePrice: 245.50,
                portfolioId: 1,
                createdAt: '2024-01-18T11:45:00Z'
            },
            {
                id: 5,
                symbol: 'NVDA',
                type: 'STOCK',
                quantity: 200,
                purchasePrice: 118.20,
                portfolioId: 1,
                createdAt: '2024-01-19T16:30:00Z'
            },
            {
                id: 6,
                symbol: 'AMD',
                type: 'STOCK',
                quantity: 80,
                purchasePrice: 142.30,
                portfolioId: 1,
                createdAt: '2024-01-20T13:10:00Z'
            }
        ];
    }

    setView(view: string) {
        this.currentView = view;
    }
}
