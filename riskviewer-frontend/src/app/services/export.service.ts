import { Injectable } from '@angular/core';
import { Position, RiskMetrics, AdvancedRiskMetrics } from './position.service';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  exportToCsv(data: any[], filename: string) {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    const csvContent = this.convertToCSV(data);
    this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
  }

  exportPositionsToCsv(positions: Position[]) {
    const csvData = positions.map(position => ({
      'Symbol': position.symbol,
      'Type': position.type,
      'Quantity': position.quantity,
      'Purchase Price': position.purchasePrice,
      'Market Value': (position.quantity * position.purchasePrice).toFixed(2),
      'Portfolio ID': position.portfolioId,
      'Created At': new Date(position.createdAt).toLocaleDateString()
    }));

    this.exportToCsv(csvData, 'portfolio-positions');
  }

  exportRiskMetricsToCsv(riskMetrics: AdvancedRiskMetrics) {
    const csvData = [
      { 'Metric': 'Portfolio Value', 'Value': `$${riskMetrics.portfolioValue.toLocaleString()}` },
      { 'Metric': 'VaR 95% (Parametric)', 'Value': `$${riskMetrics.parametricVaR95.toLocaleString()}` },
      { 'Metric': 'VaR 99% (Parametric)', 'Value': `$${riskMetrics.parametricVaR99.toLocaleString()}` },
      { 'Metric': 'VaR 95% (Monte Carlo)', 'Value': `$${riskMetrics.monteCarloVaR95.toLocaleString()}` },
      { 'Metric': 'VaR 99% (Monte Carlo)', 'Value': `$${riskMetrics.monteCarloVaR99.toLocaleString()}` },
      { 'Metric': 'Expected Shortfall 95%', 'Value': `$${riskMetrics.expectedShortfall95.toLocaleString()}` },
      { 'Metric': 'Expected Shortfall 99%', 'Value': `$${riskMetrics.expectedShortfall99.toLocaleString()}` },
      { 'Metric': 'Max Drawdown', 'Value': `${(riskMetrics.maxDrawdown * 100).toFixed(2)}%` },
      { 'Metric': 'Portfolio Beta', 'Value': riskMetrics.portfolioBeta.toFixed(3) },
      { 'Metric': 'Concentration Risk', 'Value': `${(riskMetrics.concentrationRisk * 100).toFixed(2)}%` },
      { 'Metric': 'Sharpe Ratio', 'Value': riskMetrics.sharpeRatio.toFixed(3) },
      { 'Metric': 'Calmar Ratio', 'Value': riskMetrics.calmarRatio.toFixed(3) },
      { 'Metric': 'Sortino Ratio', 'Value': riskMetrics.sortinoRatio.toFixed(3) },
      { 'Metric': 'Omega Ratio', 'Value': riskMetrics.omegaRatio.toFixed(3) },
      { 'Metric': 'Tail Ratio', 'Value': riskMetrics.tailRatio.toFixed(3) }
    ];

    this.exportToCsv(csvData, 'risk-metrics-report');
  }

  generatePdfReport(positions: Position[], riskMetrics: AdvancedRiskMetrics): void {
    // For now, we'll create a detailed HTML report that can be printed as PDF
    const reportHtml = this.generateHtmlReport(positions, riskMetrics);
    
    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportHtml);
      printWindow.document.close();
      
      // Trigger print dialog after content loads
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }

  private generateHtmlReport(positions: Position[], riskMetrics: AdvancedRiskMetrics): string {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>RiskViewer - Portfolio Risk Report</title>
        <style>
            body { 
                font-family: 'Segoe UI', Arial, sans-serif; 
                margin: 40px; 
                line-height: 1.6;
                color: #333;
            }
            .header { 
                text-align: center; 
                border-bottom: 3px solid #667eea; 
                padding-bottom: 20px; 
                margin-bottom: 30px;
            }
            .header h1 { 
                color: #667eea; 
                margin: 0; 
                font-size: 2.5em;
            }
            .header .subtitle { 
                color: #666; 
                font-size: 1.2em; 
                margin-top: 10px;
            }
            .report-info { 
                background: #f8f9fa; 
                padding: 15px; 
                border-radius: 8px; 
                margin-bottom: 30px;
                display: flex;
                justify-content: space-between;
            }
            .section { 
                margin-bottom: 30px; 
                page-break-inside: avoid;
            }
            .section h2 { 
                color: #667eea; 
                border-bottom: 2px solid #e9ecef; 
                padding-bottom: 10px;
                font-size: 1.8em;
            }
            .risk-metrics { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
                gap: 20px; 
                margin-bottom: 20px;
            }
            .metric-card { 
                background: white; 
                border: 1px solid #e9ecef; 
                border-radius: 8px; 
                padding: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .metric-card h3 { 
                margin: 0 0 10px 0; 
                color: #495057; 
                font-size: 1.1em;
            }
            .metric-value { 
                font-size: 1.8em; 
                font-weight: bold; 
                color: #667eea;
            }
            .positions-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 20px;
            }
            .positions-table th, .positions-table td { 
                border: 1px solid #dee2e6; 
                padding: 12px; 
                text-align: left;
            }
            .positions-table th { 
                background: #667eea; 
                color: white; 
                font-weight: 600;
            }
            .positions-table tr:nth-child(even) { 
                background: #f8f9fa;
            }
            .summary-stats {
                background: #e8f4f8;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                margin-top: 50px;
                padding-top: 20px;
                border-top: 1px solid #e9ecef;
                color: #666;
                font-size: 0.9em;
            }
            @media print {
                body { margin: 20px; }
                .section { page-break-inside: avoid; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🏦 RiskViewer</h1>
            <div class="subtitle">Enterprise Portfolio Risk Analysis Report</div>
        </div>
        
        <div class="report-info">
            <div><strong>Report Generated:</strong> ${currentDate} at ${currentTime}</div>
            <div><strong>Portfolio Positions:</strong> ${positions.length}</div>
            <div><strong>Total Portfolio Value:</strong> $${riskMetrics.portfolioValue.toLocaleString()}</div>
        </div>

        <div class="section">
            <h2>📊 Executive Summary</h2>
            <div class="summary-stats">
                <p><strong>Risk Assessment:</strong> This portfolio analysis incorporates advanced risk metrics including Value at Risk (VaR), Expected Shortfall, and stress testing scenarios. The portfolio demonstrates ${riskMetrics.sharpeRatio > 1 ? 'strong' : riskMetrics.sharpeRatio > 0.5 ? 'moderate' : 'weak'} risk-adjusted returns with a Sharpe ratio of ${riskMetrics.sharpeRatio.toFixed(3)}.</p>
                
                <p><strong>Key Risk Indicators:</strong></p>
                <ul>
                    <li>95% VaR (1-day): $${riskMetrics.parametricVaR95.toLocaleString()} (${((riskMetrics.parametricVaR95 / riskMetrics.portfolioValue) * 100).toFixed(2)}% of portfolio)</li>
                    <li>Maximum Drawdown: ${(riskMetrics.maxDrawdown * 100).toFixed(2)}%</li>
                    <li>Portfolio Beta: ${riskMetrics.portfolioBeta.toFixed(3)} (${riskMetrics.portfolioBeta > 1 ? 'more volatile than market' : 'less volatile than market'})</li>
                    <li>Concentration Risk: ${(riskMetrics.concentrationRisk * 100).toFixed(2)}%</li>
                </ul>
            </div>
        </div>

        <div class="section">
            <h2>📈 Risk Metrics</h2>
            <div class="risk-metrics">
                <div class="metric-card">
                    <h3>Value at Risk (95%)</h3>
                    <div class="metric-value">$${riskMetrics.parametricVaR95.toLocaleString()}</div>
                </div>
                <div class="metric-card">
                    <h3>Value at Risk (99%)</h3>
                    <div class="metric-value">$${riskMetrics.parametricVaR99.toLocaleString()}</div>
                </div>
                <div class="metric-card">
                    <h3>Expected Shortfall (95%)</h3>
                    <div class="metric-value">$${riskMetrics.expectedShortfall95.toLocaleString()}</div>
                </div>
                <div class="metric-card">
                    <h3>Sharpe Ratio</h3>
                    <div class="metric-value">${riskMetrics.sharpeRatio.toFixed(3)}</div>
                </div>
                <div class="metric-card">
                    <h3>Sortino Ratio</h3>
                    <div class="metric-value">${riskMetrics.sortinoRatio.toFixed(3)}</div>
                </div>
                <div class="metric-card">
                    <h3>Maximum Drawdown</h3>
                    <div class="metric-value">${(riskMetrics.maxDrawdown * 100).toFixed(2)}%</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>💼 Portfolio Positions</h2>
            <table class="positions-table">
                <thead>
                    <tr>
                        <th>Symbol</th>
                        <th>Type</th>
                        <th>Quantity</th>
                        <th>Purchase Price</th>
                        <th>Market Value</th>
                        <th>Weight</th>
                    </tr>
                </thead>
                <tbody>
                    ${positions.map(position => {
                        const marketValue = position.quantity * position.purchasePrice;
                        const weight = (marketValue / riskMetrics.portfolioValue) * 100;
                        return `
                        <tr>
                            <td><strong>${position.symbol}</strong></td>
                            <td>${position.type}</td>
                            <td>${position.quantity.toLocaleString()}</td>
                            <td>$${position.purchasePrice.toFixed(2)}</td>
                            <td>$${marketValue.toLocaleString()}</td>
                            <td>${weight.toFixed(2)}%</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>⚠️ Risk Disclaimer</h2>
            <p style="font-size: 0.9em; color: #666;">
                This report is generated by RiskViewer Enterprise Risk Analytics Platform for informational purposes only. 
                Risk metrics are calculated using historical data and mathematical models which may not accurately predict future performance. 
                Past performance does not guarantee future results. All investments carry inherent risks and may result in loss of principal. 
                This analysis should be used in conjunction with other risk management tools and professional judgment.
            </p>
        </div>

        <div class="footer">
            Generated by RiskViewer Enterprise Risk Analytics Platform | RAMPP Team | ${currentDate}
        </div>
    </body>
    </html>
    `;
  }

  private convertToCSV(data: any[]): string {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  }

  private downloadFile(content: string, fileName: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
  }
}
