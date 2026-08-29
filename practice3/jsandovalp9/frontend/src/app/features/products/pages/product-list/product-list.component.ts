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
  pageSize = signal(10);
  loading = signal(false);
  paginationMode = signal<'offset' | 'infinite'>('offset');
  hasMore = signal(true);

  searchTerm = '';
  sortBy = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(public auth: AuthService, private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts({ reset: true });
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const bottomReached = window.innerHeight + window.scrollY >= document.body.offsetHeight - 220;

    if (
      this.paginationMode() === 'infinite' &&
      bottomReached &&
      !this.loading() &&
      this.hasMore()
    ) {
      this.loadMore();
    }
  }

  loadProducts(options: { reset?: boolean } = {}): void {
    const reset = options.reset ?? false;
    const currentPage = reset ? 1 : this.page();

    this.loading.set(true);
    this.productService.getProducts(this.searchTerm, this.sortBy, this.sortDirection, currentPage, this.pageSize()).subscribe({
      next: (res) => {
        const combinedItems = reset ? res.items : [...this.products(), ...res.items];

        this.products.set(combinedItems);
        this.totalItems.set(res.totalItems);
        this.totalPages.set(res.totalPages);
        this.page.set(currentPage);
        this.hasMore.set(currentPage < res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadMore(): void {
    if (this.paginationMode() !== 'infinite') {
      return;
    }

    const nextPage = this.page() + 1;
    if (nextPage > this.totalPages()) {
      this.hasMore.set(false);
      return;
    }

    this.page.set(nextPage);
    this.loadProducts({ reset: false });
  }

  onSearchChange(): void {
    this.page.set(1);
    this.loadProducts({ reset: true });
  }

  switchMode(mode: 'offset' | 'infinite'): void {
    this.paginationMode.set(mode);
    this.page.set(1);
    this.products.set([]);
    this.loadProducts({ reset: true });
  }

  toggleSort(column: string): void {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    this.loadProducts({ reset: true });
  }

  deleteProduct(id: string): void {
    if (confirm('Delete product?')) {
      this.productService.deleteProduct(id).subscribe(() => this.loadProducts({ reset: true }));
    }
  }

  setPage(p: number): void {
    this.page.set(p);
    this.loadProducts({ reset: false });
  }
}