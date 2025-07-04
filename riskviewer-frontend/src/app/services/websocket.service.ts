import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RiskAlert, RealTimeMarketData } from './position.service';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;

  // Observables for real-time data
  private marketDataSubject = new BehaviorSubject<RealTimeMarketData[]>([]);
  private alertsSubject = new BehaviorSubject<RiskAlert[]>([]);
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);

  public marketData$ = this.marketDataSubject.asObservable();
  public alerts$ = this.alertsSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      // Try to connect to WebSocket server (fallback to simulation if not available)
      this.ws = new WebSocket('ws://localhost:8080/ws/realtime');
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.connectionStatusSubject.next(true);
        this.reconnectAttempts = 0;
        
        // Subscribe to market data and alerts
        this.subscribeToChannels();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.connectionStatusSubject.next(false);
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.log('❌ WebSocket error, falling back to simulation:', error);
        this.connectionStatusSubject.next(false);
        this.startSimulation();
      };

    } catch (error) {
      console.log('🔄 WebSocket not available, starting simulation mode');
      this.startSimulation();
    }
  }

  private subscribeToChannels() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Subscribe to market data
      this.ws.send(JSON.stringify({
        action: 'subscribe',
        channel: 'market-data',
        symbols: ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'SPY', 'QQQ']
      }));

      // Subscribe to risk alerts
      this.ws.send(JSON.stringify({
        action: 'subscribe',
        channel: 'risk-alerts',
        portfolios: [1, 2, 3]
      }));
    }
  }

  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'market-data':
          this.marketDataSubject.next(message.data);
          break;
        case 'risk-alert':
          const currentAlerts = this.alertsSubject.value;
          this.alertsSubject.next([message.data, ...currentAlerts]);
          break;
        case 'market-update':
          this.updateMarketData(message.data);
          break;
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private updateMarketData(update: any) {
    const currentData = this.marketDataSubject.value;
    const updatedData = currentData.map(item => 
      item.symbol === update.symbol ? { ...item, ...update } : item
    );
    this.marketDataSubject.next(updatedData);
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.log('❌ Max reconnect attempts reached, starting simulation mode');
      this.startSimulation();
    }
  }

  private startSimulation() {
    console.log('🎭 Starting simulation mode for real-time data');
    this.connectionStatusSubject.next(true); // Show as connected in simulation mode
    
    // Generate initial data
    this.generateMockMarketData();
    this.generateMockAlerts();
    
    // Update every 5 seconds
    setInterval(() => {
      this.generateMockMarketData();
      
      // Randomly add new alerts (20% chance every update)
      if (Math.random() > 0.8) {
        this.generateNewMockAlert();
      }
    }, 5000);
  }

  private generateMockMarketData() {
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'SPY', 'QQQ'];
    const basePrices: { [key: string]: number } = {
      'AAPL': 175, 'MSFT': 340, 'GOOGL': 125, 
      'TSLA': 250, 'SPY': 425, 'QQQ': 360
    };

    const marketData: RealTimeMarketData[] = symbols.map(symbol => {
      const basePrice = basePrices[symbol];
      const changePercent = (Math.random() - 0.5) * 4; // ±2%
      const currentPrice = basePrice * (1 + changePercent / 100);
      const volatility = 15 + Math.random() * 25; // 15-40%
      
      return {
        symbol,
        currentPrice,
        volatility,
        lastUpdated: new Date().toISOString(),
        changePercent,
        alerts: []
      };
    });

    this.marketDataSubject.next(marketData);
  }

  private generateMockAlerts() {
    const mockAlerts: RiskAlert[] = [
      {
        id: 1,
        message: 'Portfolio 1 VaR (95%) exceeded threshold: $125,000 > $100,000',
        severity: 'CRITICAL',
        alertType: 'VAR_BREACH',
        portfolioId: 1,
        symbol: undefined,
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        message: 'AAPL position concentration risk: 25% > 20% limit',
        severity: 'HIGH',
        alertType: 'CONCENTRATION_RISK',
        portfolioId: 1,
        symbol: 'AAPL',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      }
    ];

    this.alertsSubject.next(mockAlerts);
  }

  private generateNewMockAlert() {
    const currentAlerts = this.alertsSubject.value;
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA'];
    const alertTypes = ['VAR_BREACH', 'CONCENTRATION_RISK', 'VOLATILITY_SPIKE', 'LIQUIDITY_RISK'];
    const severities = ['HIGH', 'MEDIUM', 'CRITICAL'];
    
    const newAlert: RiskAlert = {
      id: Date.now(),
      message: `Real-time alert: ${symbols[Math.floor(Math.random() * symbols.length)]} threshold breach detected`,
      severity: severities[Math.floor(Math.random() * severities.length)],
      alertType: alertTypes[Math.floor(Math.random() * alertTypes.length)],
      portfolioId: Math.floor(Math.random() * 3) + 1,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      timestamp: new Date().toISOString()
    };

    this.alertsSubject.next([newAlert, ...currentAlerts.slice(0, 9)]); // Keep only last 10 alerts
  }

  // Public methods for sending messages
  acknowledgeAlert(alertId: number) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'acknowledge-alert',
        alertId: alertId
      }));
    }
    
    // Remove from local state
    const currentAlerts = this.alertsSubject.value;
    const filteredAlerts = currentAlerts.filter(alert => alert.id !== alertId);
    this.alertsSubject.next(filteredAlerts);
  }

  subscribeToSymbol(symbol: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'subscribe',
        channel: 'market-data',
        symbols: [symbol]
      }));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
