import { Component, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../../core/services/product.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Product } from '../../../../core/models/product.model';

type PaginationMode = 'offset' | 'infinite';

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
  loadingMore = signal(false);
  hasMore = signal(true);

  paginationMode = signal<PaginationMode>('offset');

  searchTerm = '';
  sortBy = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  readonly pageSize = 10;

  constructor(public auth: AuthService, private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  // Detects when the user is near the bottom of the page and, in
  // infinite-scroll mode, triggers loading of the next page.
  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.paginationMode() !== 'infinite') return;
    if (this.loading() || this.loadingMore() || !this.hasMore()) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.documentElement.scrollHeight - 250;

    if (scrollPosition >= threshold) {
      this.loadMore();
    }
  }

  setMode(mode: PaginationMode): void {
    if (this.paginationMode() === mode) return;
    this.paginationMode.set(mode);
    this.resetAndLoad();
  }

  private resetAndLoad(): void {
    this.page.set(1);
    this.products.set([]);
    this.hasMore.set(true);
    this.loadProducts();
  }

  // Initial load / offset-mode page change: replaces the current items.
  loadProducts(): void {
    this.loading.set(true);
    this.productService.getProducts(this.searchTerm, this.sortBy, this.sortDirection, this.page(), this.pageSize).subscribe({
      next: (res) => {
        this.products.set(res.items);
        this.totalItems.set(res.totalItems);
        this.totalPages.set(res.totalPages);
        this.hasMore.set(res.page < res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  // Infinite-scroll mode: appends the next page's items to the list.
  loadMore(): void {
    if (!this.hasMore() || this.loadingMore()) return;

    this.loadingMore.set(true);
    const nextPage = this.page() + 1;

    this.productService.getProducts(this.searchTerm, this.sortBy, this.sortDirection, nextPage, this.pageSize).subscribe({
      next: (res) => {
        this.products.update(current => [...current, ...res.items]);
        this.page.set(res.page);
        this.totalItems.set(res.totalItems);
        this.totalPages.set(res.totalPages);
        this.hasMore.set(res.page < res.totalPages);
        this.loadingMore.set(false);
      },
      error: () => this.loadingMore.set(false)
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
}