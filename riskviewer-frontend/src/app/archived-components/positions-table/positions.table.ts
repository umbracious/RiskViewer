import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Position } from "../services/position.service";

@Component({
    selector: "positions-table",
    template: `
        <div class="positions-container">
            <h2>Current Positions</h2>
            
            <div *ngIf="!positions || positions.length === 0" class="no-data">
                No positions found
            </div>
            
            <table *ngIf="positions && positions.length > 0" class="positions-table">
                <thead>
                    <tr>
                        <th>Symbol</th>
                        <th>Type</th>
                        <th>Quantity</th>
                        <th>Purchase Price</th>
                        <th>Total Value</th>
                        <th>Portfolio</th>
                        <th>Created</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let position of positions" class="position-row">
                        <td class="symbol">{{ position.symbol }}</td>
                        <td>{{ position.type }}</td>
                        <td class="number">{{ position.quantity | number:'1.0-0' }}</td>
                        <td class="currency">\${{ position.purchasePrice | number:'1.2-2' }}</td>
                        <td class="currency">\${{ getTotalValue(position) | number:'1.2-2' }}</td>
                        <td>Portfolio {{ position.portfolioId }}</td>
                        <td class="date">{{ position.createdAt | date:'short' }}</td>
                    </tr>
                </tbody>
            </table>
            
            <div *ngIf="positions && positions.length > 0" class="summary">
                <p><strong>Total Positions:</strong> {{ positions.length }}</p>
                <p><strong>Total Value:</strong> \${{ getTotalPortfolioValue() | number:'1.2-2' }}</p>
            </div>
        </div>
    `,
    styles: [`
        .positions-container {
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }
        h2 {
            color: #2c3e50;
            margin-bottom: 1rem;
        }
        .positions-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1rem;
        }
        .positions-table th {
            background: #f8f9fa;
            padding: 0.75rem;
            text-align: left;
            border-bottom: 2px solid #dee2e6;
            font-weight: 600;
            color: #495057;
        }
        .positions-table td {
            padding: 0.75rem;
            border-bottom: 1px solid #dee2e6;
        }
        .position-row:hover {
            background: #f8f9fa;
        }
        .symbol {
            font-weight: 600;
            color: #007bff;
        }
        .number, .currency {
            text-align: right;
        }
        .date {
            font-size: 0.875rem;
            color: #6c757d;
        }
        .no-data {
            text-align: center;
            color: #6c757d;
            padding: 2rem;
        }
        .summary {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 4px;
            margin-top: 1rem;
        }
        .summary p {
            margin: 0.25rem 0;
        }
    `],
    imports: [CommonModule]
})
export class PositionsTable {
    @Input() positions: Position[] = [];

    getTotalValue(position: Position): number {
        return position.quantity * position.purchasePrice;
    }

    getTotalPortfolioValue(): number {
        return this.positions.reduce((total, position) => {
            return total + this.getTotalValue(position);
        }, 0);
    }
}
