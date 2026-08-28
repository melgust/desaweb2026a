import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../../core/services/product.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Product } from '../../../../core/models/product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  products = signal<Product[]>([]);
  totalItems = signal(0);
  totalPages = signal(0);
  page = signal(1);
  loading = signal(false);
  paginationMode: 'offset' | 'infinite' = 'offset';
  readonly pageSize = 10;

  searchTerm = '';
  sortBy = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(public auth: AuthService, private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.productService.getProducts(this.searchTerm, this.sortBy, this.sortDirection, this.page(), this.pageSize).subscribe({
      next: (res) => {
        this.products.update(current =>
          this.paginationMode === 'infinite' && res.page > 1
            ? [...current, ...res.items.filter(item => !current.some(existing => existing.id === item.id))]
            : res.items
        );
        this.totalItems.set(res.totalItems);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearchChange(): void {
    this.resetAndLoad();
  }

  toggleSort(column: string): void {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    this.resetAndLoad();
  }

  deleteProduct(id: string): void {
    if (confirm('Delete product?')) {
      this.productService.deleteProduct(id).subscribe(() => this.resetAndLoad());
    }
  }

  setPage(p: number): void {
    this.page.set(p);
    this.loadProducts();
  }

  setPaginationMode(mode: 'offset' | 'infinite'): void {
    if (this.paginationMode === mode) return;
    this.paginationMode = mode;
    this.resetAndLoad();
  }

  onInventoryScroll(event: Event): void {
    if (this.paginationMode !== 'infinite' || this.loading() || this.page() >= this.totalPages()) return;
    const element = event.target as HTMLElement;
    const remaining = element.scrollHeight - element.scrollTop - element.clientHeight;
    if (remaining <= 120) {
      this.page.update(value => value + 1);
      this.loadProducts();
    }
  }

  private resetAndLoad(): void {
    this.page.set(1);
    this.products.set([]);
    this.loadProducts();
  }
}
