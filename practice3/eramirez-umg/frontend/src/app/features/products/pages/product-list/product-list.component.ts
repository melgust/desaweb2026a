import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
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
export class ProductListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('loadMoreTrigger') private loadMoreTrigger?: ElementRef<HTMLElement>;

  products = signal<Product[]>([]);
  totalItems = signal(0);
  totalPages = signal(0);
  page = signal(1);
  loading = signal(false);
  hasMore = signal(true);
  paginationMode: 'offset' | 'infinite' = 'offset';

  private observer?: IntersectionObserver;
  private readonly pageSize = 20;

  searchTerm = '';
  sortBy = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(public auth: AuthService, private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && this.paginationMode === 'infinite' && this.hasMore() && !this.loading()) {
        this.loadProducts(true);
      }
    }, { rootMargin: '240px' });

    if (this.loadMoreTrigger) {
      this.observer.observe(this.loadMoreTrigger.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  loadProducts(append = false): void {
    const requestedPage = append ? this.page() + 1 : this.page();
    if (append) {
      this.page.set(requestedPage);
    }

    this.loading.set(true);
    this.productService.getProducts(this.searchTerm, this.sortBy, this.sortDirection, requestedPage, this.pageSize).subscribe({
      next: (res) => {
        this.products.update(current => append ? [...current, ...res.items] : res.items);
        this.totalItems.set(res.totalItems);
        this.totalPages.set(res.totalPages);
        this.hasMore.set(res.page < res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearchChange(): void {
    this.page.set(1);
    this.products.set([]);
    this.hasMore.set(true);
    this.loadProducts();
  }

  toggleSort(column: string): void {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    this.page.set(1);
    this.products.set([]);
    this.hasMore.set(true);
    this.loadProducts();
  }

  deleteProduct(id: string): void {
    if (confirm('Delete product?')) {
      this.productService.deleteProduct(id).subscribe(() => this.loadProducts());
    }
  }

  setPage(p: number): void {
    this.page.set(p);
    this.loadProducts();
  }

  setPaginationMode(mode: 'offset' | 'infinite'): void {
    this.paginationMode = mode;
    this.page.set(1);
    this.products.set([]);
    this.hasMore.set(true);
    this.loadProducts();
  }
}