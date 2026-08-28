import { Component, HostListener, OnInit, signal } from '@angular/core';
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
  hasMore = signal(true);
  paginationMode = signal<'offset' | 'infinite'>('offset');

  searchTerm = '';
  sortBy = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(public auth: AuthService, private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts(true);
  }

  loadProducts(reset = false): void {
    if (this.loading() || (!reset && this.paginationMode() === 'infinite' && !this.hasMore())) {
      return;
    }

    const requestedPage = reset ? 1 : this.page();
    this.loading.set(true);
    this.productService.getProducts(this.searchTerm, this.sortBy, this.sortDirection, requestedPage).subscribe({
      next: (res) => {
        if (this.paginationMode() === 'infinite' && !reset) {
          this.products.update(current => [...current, ...res.items]);
        } else {
          this.products.set(res.items);
        }
        this.page.set(res.page);
        this.totalItems.set(res.totalItems);
        this.totalPages.set(res.totalPages);
        this.hasMore.set(res.page < res.totalPages && res.items.length > 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearchChange(): void {
    this.page.set(1);
    this.hasMore.set(true);
    this.loadProducts(true);
  }

  toggleSort(column: string): void {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    this.page.set(1);
    this.hasMore.set(true);
    this.loadProducts(true);
  }

  deleteProduct(id: string): void {
    if (confirm('Delete product?')) {
      this.productService.deleteProduct(id).subscribe(() => this.loadProducts(true));
    }
  }

  setPage(p: number): void {
    this.page.set(p);
    this.loadProducts(false);
  }

  setPaginationMode(mode: 'offset' | 'infinite'): void {
    if (this.paginationMode() === mode) {
      return;
    }
    this.paginationMode.set(mode);
    this.page.set(1);
    this.hasMore.set(true);
    this.loadProducts(true);
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.paginationMode() !== 'infinite' || this.loading() || !this.hasMore()) {
      return;
    }

    const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 300;
    if (nearBottom) {
      this.page.set(this.page() + 1);
      this.loadProducts(false);
    }
  }
}