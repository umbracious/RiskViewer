import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PositionService, StructuredProduct } from '../services/position.service';

@Component({
  selector: 'app-structured-products',
  template: `
    <div class="structured-products-container">
      <div class="header">
        <h2>🏛️ Structured Products Management</h2>
        <button class="btn-primary" (click)="showCreateForm = !showCreateForm">
          {{ showCreateForm ? 'Cancel' : 'Create New Product' }}
        </button>
      </div>

      <!-- Create Product Form -->
      <div *ngIf="showCreateForm" class="create-form-section">
        <h3>Create New Structured Product</h3>
        <form (ngSubmit)="createProduct()" class="product-form">
          <div class="form-row">
            <div class="form-group">
              <label for="name">Product Name</label>
              <input
                id="name"
                type="text"
                [(ngModel)]="newProduct.name"
                name="name"
                required
                placeholder="e.g., SPX Barrier Note 2024"
              />
            </div>
            <div class="form-group">
              <label for="productType">Product Type</label>
              <select id="productType" [(ngModel)]="newProduct.productType" name="productType" required>
                <option value="BARRIER_NOTE">Barrier Note</option>
                <option value="AUTOCALLABLE">Autocallable</option>
                <option value="REVERSE_CONVERTIBLE">Reverse Convertible</option>
                <option value="MARKET_LINKED_CD">Market Linked CD</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="underlyingAsset">Underlying Asset</label>
              <input
                id="underlyingAsset"
                type="text"
                [(ngModel)]="newProduct.underlyingAsset"
                name="underlyingAsset"
                required
                placeholder="e.g., SPY, AAPL, QQQ"
              />
            </div>
            <div class="form-group">
              <label for="portfolioId">Portfolio ID</label>
              <input
                id="portfolioId"
                type="number"
                [(ngModel)]="newProduct.portfolioId"
                name="portfolioId"
                required
                min="1"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="notionalAmount">Notional Amount (\$)</label>
              <input
                id="notionalAmount"
                type="number"
                [(ngModel)]="newProduct.notionalAmount"
                name="notionalAmount"
                required
                min="1000"
                step="1000"
              />
            </div>
            <div class="form-group">
              <label for="strike">Strike Price (\$)</label>
              <input
                id="strike"
                type="number"
                [(ngModel)]="newProduct.strike"
                name="strike"
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="barrier">Barrier Level (\$) - Optional</label>
              <input
                id="barrier"
                type="number"
                [(ngModel)]="newProduct.barrier"
                name="barrier"
                min="0"
                step="0.01"
                placeholder="Leave empty if not applicable"
              />
            </div>
            <div class="form-group">
              <label for="maturityDate">Maturity Date</label>
              <input
                id="maturityDate"
                type="date"
                [(ngModel)]="newProduct.maturityDate"
                name="maturityDate"
                required
              />
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" [disabled]="isCreating">
              {{ isCreating ? 'Creating...' : 'Create Product' }}
            </button>
            <button type="button" class="btn-secondary" (click)="resetForm()">
              Reset Form
            </button>
          </div>
        </form>
      </div>

      <!-- Products List -->
      <div class="products-section">
        <h3>Existing Structured Products</h3>
        
        <div *ngIf="loading" class="loading">
          <div class="spinner"></div>
          <p>Loading structured products...</p>
        </div>

        <div *ngIf="!loading && products.length === 0" class="no-products">
          <div class="no-products-icon">🏛️</div>
          <p>No structured products found</p>
          <p class="subtitle">Create your first structured product to get started</p>
        </div>

        <div *ngIf="!loading && products.length > 0" class="products-grid">
          <div *ngFor="let product of products; trackBy: trackProduct" class="product-card">
            <div class="product-header">
              <h4>{{ product.name }}</h4>
              <span class="product-type">{{ formatProductType(product.productType) }}</span>
            </div>
            
            <div class="product-details">
              <div class="detail-row">
                <span class="label">Underlying:</span>
                <span class="value">{{ product.underlyingAsset }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Notional:</span>
                <span class="value">\${{ product.notionalAmount | number:'1.0-0' }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Strike:</span>
                <span class="value">\${{ product.strike | number:'1.2-2' }}</span>
              </div>
              <div class="detail-row" *ngIf="product.barrier">
                <span class="label">Barrier:</span>
                <span class="value">\${{ product.barrier | number:'1.2-2' }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Maturity:</span>
                <span class="value">{{ formatDate(product.maturityDate) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Portfolio:</span>
                <span class="value">{{ product.portfolioId }}</span>
              </div>
            </div>

            <div class="pricing-section" *ngIf="productPricing[product.id]">
              <h5>Current Pricing & Greeks</h5>
              <div class="pricing-grid">
                <div class="pricing-item">
                  <span class="pricing-label">Fair Value:</span>
                  <span class="pricing-value">\${{ productPricing[product.id].fairValue | number:'1.2-2' }}</span>
                </div>
                <div class="pricing-item">
                  <span class="pricing-label">Delta:</span>
                  <span class="pricing-value">{{ productPricing[product.id].delta | number:'1.4-4' }}</span>
                </div>
                <div class="pricing-item">
                  <span class="pricing-label">Gamma:</span>
                  <span class="pricing-value">{{ productPricing[product.id].gamma | number:'1.6-6' }}</span>
                </div>
                <div class="pricing-item">
                  <span class="pricing-label">Theta:</span>
                  <span class="pricing-value">{{ productPricing[product.id].theta | number:'1.4-4' }}</span>
                </div>
                <div class="pricing-item">
                  <span class="pricing-label">Vega:</span>
                  <span class="pricing-value">{{ productPricing[product.id].vega | number:'1.4-4' }}</span>
                </div>
                <div class="pricing-item">
                  <span class="pricing-label">Rho:</span>
                  <span class="pricing-value">{{ productPricing[product.id].rho | number:'1.4-4' }}</span>
                </div>
              </div>
            </div>

            <div class="product-actions">
              <button 
                class="btn-pricing" 
                (click)="loadPricing(product.id)"
                [disabled]="loadingPricing.has(product.id)"
              >
                {{ loadingPricing.has(product.id) ? 'Loading...' : 'Load Pricing' }}
              </button>
              <button class="btn-analytics" (click)="viewAnalytics(product)">
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .structured-products-container {
      background: #f8f9fa;
      min-height: 100vh;
      padding: 1rem;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      padding: 1.5rem 2rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .header h2 {
      margin: 0;
      color: #495057;
      font-weight: 700;
    }

    .btn-primary {
      background: #007bff;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.2s;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn-primary:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.2s;
    }

    .btn-secondary:hover {
      background: #5a6268;
    }

    .create-form-section {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .create-form-section h3 {
      margin: 0 0 1.5rem 0;
      color: #495057;
      font-size: 1.25rem;
    }

    .product-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #495057;
    }

    .form-group input,
    .form-group select {
      padding: 0.75rem;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.2s;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 0.2rem rgba(0,123,255,0.25);
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }

    .products-section {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .products-section h3 {
      margin: 0 0 1.5rem 0;
      color: #495057;
      font-size: 1.25rem;
    }

    .loading {
      text-align: center;
      padding: 3rem;
    }

    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .no-products {
      text-align: center;
      padding: 3rem;
      color: #6c757d;
    }

    .no-products-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .subtitle {
      font-size: 0.875rem;
      color: #adb5bd;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
    }

    .product-card {
      border: 1px solid #e9ecef;
      border-radius: 12px;
      padding: 1.5rem;
      background: white;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .product-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .product-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .product-header h4 {
      margin: 0;
      color: #495057;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .product-type {
      background: #e9ecef;
      color: #495057;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .product-details {
      margin-bottom: 1.5rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f8f9fa;
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .label {
      font-weight: 500;
      color: #6c757d;
    }

    .value {
      font-weight: 600;
      color: #495057;
    }

    .pricing-section {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .pricing-section h5 {
      margin: 0 0 1rem 0;
      color: #495057;
      font-size: 1rem;
    }

    .pricing-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }

    .pricing-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.25rem 0;
    }

    .pricing-label {
      font-size: 0.875rem;
      color: #6c757d;
    }

    .pricing-value {
      font-weight: 600;
      color: #495057;
      font-size: 0.875rem;
    }

    .product-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-pricing {
      background: #28a745;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      flex: 1;
      transition: background 0.2s;
    }

    .btn-pricing:hover:not(:disabled) {
      background: #218838;
    }

    .btn-pricing:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }

    .btn-analytics {
      background: #17a2b8;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      flex: 1;
      transition: background 0.2s;
    }

    .btn-analytics:hover {
      background: #138496;
    }
  `],
  imports: [CommonModule, FormsModule]
})
export class StructuredProductsComponent implements OnInit {
  products: StructuredProduct[] = [];
  productPricing: { [key: number]: any } = {};
  loadingPricing = new Set<number>();
  loading = false;
  showCreateForm = false;
  isCreating = false;

  newProduct = {
    name: '',
    productType: 'BARRIER_NOTE',
    underlyingAsset: '',
    maturityDate: '',
    notionalAmount: 100000,
    strike: 100,
    barrier: null as number | null,
    portfolioId: 1
  };

  constructor(private positionService: PositionService) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    this.positionService.getAllStructuredProducts().subscribe({
      next: (products) => {
        this.products = products.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading structured products:', error);
        this.loading = false;
      }
    });
  }

  createProduct() {
    if (!this.validateForm()) {
      return;
    }

    this.isCreating = true;
    
    const productData = {
      ...this.newProduct,
      barrier: this.newProduct.barrier || undefined
    };

    this.positionService.createStructuredProduct(productData).subscribe({
      next: (product) => {
        this.products.unshift(product);
        this.resetForm();
        this.showCreateForm = false;
        this.isCreating = false;
      },
      error: (error) => {
        console.error('Error creating structured product:', error);
        this.isCreating = false;
      }
    });
  }

  loadPricing(productId: number) {
    this.loadingPricing.add(productId);
    
    this.positionService.getStructuredProductPricing(productId).subscribe({
      next: (pricing) => {
        this.productPricing[productId] = pricing;
        this.loadingPricing.delete(productId);
      },
      error: (error) => {
        console.error('Error loading pricing:', error);
        this.loadingPricing.delete(productId);
      }
    });
  }

  viewAnalytics(product: StructuredProduct) {
    // This could navigate to a detailed analytics view
    console.log('Viewing analytics for product:', product.name);
    // For now, just load pricing if not already loaded
    if (!this.productPricing[product.id]) {
      this.loadPricing(product.id);
    }
  }

  validateForm(): boolean {
    return !!(
      this.newProduct.name &&
      this.newProduct.productType &&
      this.newProduct.underlyingAsset &&
      this.newProduct.maturityDate &&
      this.newProduct.notionalAmount > 0 &&
      this.newProduct.strike > 0 &&
      this.newProduct.portfolioId > 0
    );
  }

  resetForm() {
    this.newProduct = {
      name: '',
      productType: 'BARRIER_NOTE',
      underlyingAsset: '',
      maturityDate: '',
      notionalAmount: 100000,
      strike: 100,
      barrier: null,
      portfolioId: 1
    };
  }

  trackProduct(index: number, product: StructuredProduct): number {
    return product.id;
  }

  formatProductType(type: string): string {
    return type.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
