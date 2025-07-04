import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { MarketDataService, MarketData } from './market-data.service';
import { PositionService } from './position.service';

export interface Alert {
  id: string;
  type: 'PRICE' | 'VOLATILITY' | 'VOLUME' | 'RISK' | 'NEWS';
  severity: 'low' | 'medium' | 'high' | 'critical';
  symbol: string;
  message: string;
  timestamp: Date;
  triggered: boolean;
  acknowledged: boolean;
  value?: number;
  threshold?: number;
}

export interface RiskThreshold {
  id: string;
  symbol: string;
  type: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'VOLATILITY_ABOVE' | 'CHANGE_PERCENT_ABOVE' | 'CHANGE_PERCENT_BELOW';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alerts: Alert[] = [];
  private alertsSubject = new BehaviorSubject<Alert[]>([]);
  private thresholds: RiskThreshold[] = [];
  
  // Default risk thresholds
  private defaultThresholds: RiskThreshold[] = [
    {
      id: 'vol_high',
      symbol: '*',
      type: 'VOLATILITY_ABOVE',
      threshold: 5.0,
      severity: 'medium',
      enabled: true
    },
    {
      id: 'vol_critical',
      symbol: '*',
      type: 'VOLATILITY_ABOVE',
      threshold: 10.0,
      severity: 'critical',
      enabled: true
    },
    {
      id: 'change_high_pos',
      symbol: '*',
      type: 'CHANGE_PERCENT_ABOVE',
      threshold: 5.0,
      severity: 'medium',
      enabled: true
    },
    {
      id: 'change_high_neg',
      symbol: '*',
      type: 'CHANGE_PERCENT_BELOW',
      threshold: -5.0,
      severity: 'medium',
      enabled: true
    },
    {
      id: 'change_critical_pos',
      symbol: '*',
      type: 'CHANGE_PERCENT_ABOVE',
      threshold: 10.0,
      severity: 'critical',
      enabled: true
    },
    {
      id: 'change_critical_neg',
      symbol: '*',
      type: 'CHANGE_PERCENT_BELOW',
      threshold: -10.0,
      severity: 'critical',
      enabled: true
    }
  ];

  public alerts$ = this.alertsSubject.asObservable();

  constructor(
    private marketDataService: MarketDataService,
    private positionService: PositionService
  ) {
    this.thresholds = [...this.defaultThresholds];
    this.startAlertMonitoring();
  }

  /**
   * Start monitoring market data for alert conditions
   */
  private startAlertMonitoring(): void {
    // Monitor market data changes
    this.marketDataService.marketData$.subscribe(marketDataMap => {
      this.checkAlerts(Array.from(marketDataMap.values()));
    });

    // Clean up old alerts every 5 minutes
    interval(300000).subscribe(() => {
      this.cleanupOldAlerts();
    });
  }

  /**
   * Check all market data against alert thresholds
   */
  private checkAlerts(marketData: MarketData[]): void {
    marketData.forEach(data => {
      this.thresholds
        .filter(threshold => threshold.enabled && (threshold.symbol === '*' || threshold.symbol === data.symbol))
        .forEach(threshold => {
          this.evaluateThreshold(data, threshold);
        });
    });

    // Update alerts subject
    this.alertsSubject.next([...this.alerts]);
  }

  /**
   * Evaluate a specific threshold against market data
   */
  private evaluateThreshold(data: MarketData, threshold: RiskThreshold): void {
    let triggered = false;
    let value = 0;
    let message = '';

    switch (threshold.type) {
      case 'PRICE_ABOVE':
        value = data.currentPrice;
        triggered = value > threshold.threshold;
        message = `${data.symbol} price (${value.toFixed(2)}) above threshold (${threshold.threshold.toFixed(2)})`;
        break;

      case 'PRICE_BELOW':
        value = data.currentPrice;
        triggered = value < threshold.threshold;
        message = `${data.symbol} price (${value.toFixed(2)}) below threshold (${threshold.threshold.toFixed(2)})`;
        break;

      case 'VOLATILITY_ABOVE':
        value = Math.abs(data.changePercent);
        triggered = value > threshold.threshold;
        message = `${data.symbol} high volatility: ${value.toFixed(2)}% change`;
        break;

      case 'CHANGE_PERCENT_ABOVE':
        value = data.changePercent;
        triggered = value > threshold.threshold;
        message = `${data.symbol} up ${value.toFixed(2)}% today`;
        break;

      case 'CHANGE_PERCENT_BELOW':
        value = data.changePercent;
        triggered = value < threshold.threshold;
        message = `${data.symbol} down ${Math.abs(value).toFixed(2)}% today`;
        break;
    }

    if (triggered) {
      // Check if this alert already exists (within last 5 minutes)
      const existingAlert = this.alerts.find(alert => 
        alert.symbol === data.symbol && 
        alert.type === this.getAlertType(threshold.type) &&
        (Date.now() - alert.timestamp.getTime()) < 300000 // 5 minutes
      );

      if (!existingAlert) {
        const alert: Alert = {
          id: `${threshold.id}_${data.symbol}_${Date.now()}`,
          type: this.getAlertType(threshold.type),
          severity: threshold.severity,
          symbol: data.symbol,
          message,
          timestamp: new Date(),
          triggered: true,
          acknowledged: false,
          value,
          threshold: threshold.threshold
        };

        this.alerts.unshift(alert);
        this.sendNotification(alert);
      }
    }
  }

  /**
   * Map threshold type to alert type
   */
  private getAlertType(thresholdType: string): Alert['type'] {
    switch (thresholdType) {
      case 'PRICE_ABOVE':
      case 'PRICE_BELOW':
        return 'PRICE';
      case 'VOLATILITY_ABOVE':
        return 'VOLATILITY';
      case 'CHANGE_PERCENT_ABOVE':
      case 'CHANGE_PERCENT_BELOW':
        return 'PRICE';
      default:
        return 'RISK';
    }
  }

  /**
   * Send browser notification for critical alerts
   */
  private sendNotification(alert: Alert): void {
    if (alert.severity === 'critical' || alert.severity === 'high') {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`RiskViewer Alert: ${alert.symbol}`, {
          body: alert.message,
          icon: '/favicon.ico',
          tag: alert.id
        });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(`RiskViewer Alert: ${alert.symbol}`, {
              body: alert.message,
              icon: '/favicon.ico',
              tag: alert.id
            });
          }
        });
      }
    }

    // Log all alerts to console
    console.warn(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`);
  }

  /**
   * Clean up old alerts (older than 1 hour)
   */
  private cleanupOldAlerts(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => alert.timestamp.getTime() > oneHourAgo);
    this.alertsSubject.next([...this.alerts]);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.alertsSubject.next([...this.alerts]);
    }
  }

  /**
   * Dismiss an alert
   */
  dismissAlert(alertId: string): void {
    this.alerts = this.alerts.filter(a => a.id !== alertId);
    this.alertsSubject.next([...this.alerts]);
  }

  /**
   * Get active alerts (not acknowledged)
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: Alert['severity']): Alert[] {
    return this.alerts.filter(alert => alert.severity === severity);
  }

  /**
   * Get alerts by symbol
   */
  getAlertsBySymbol(symbol: string): Alert[] {
    return this.alerts.filter(alert => alert.symbol === symbol);
  }

  /**
   * Add custom threshold
   */
  addThreshold(threshold: Omit<RiskThreshold, 'id'>): void {
    const newThreshold: RiskThreshold = {
      ...threshold,
      id: `custom_${Date.now()}`
    };
    this.thresholds.push(newThreshold);
  }

  /**
   * Remove threshold
   */
  removeThreshold(thresholdId: string): void {
    this.thresholds = this.thresholds.filter(t => t.id !== thresholdId);
  }

  /**
   * Get all thresholds
   */
  getThresholds(): RiskThreshold[] {
    return [...this.thresholds];
  }

  /**
   * Update threshold
   */
  updateThreshold(thresholdId: string, updates: Partial<RiskThreshold>): void {
    const threshold = this.thresholds.find(t => t.id === thresholdId);
    if (threshold) {
      Object.assign(threshold, updates);
    }
  }
}
