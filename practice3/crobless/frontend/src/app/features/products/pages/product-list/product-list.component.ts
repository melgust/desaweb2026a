import { Component, OnInit, ViewChild, signal, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ProductService } from '../../../../core/services/product.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Product } from '../../../../core/models/product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, MatTableModule, MatPaginatorModule,
    MatSortModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressBarModule
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('scrollTrigger') scrollTrigger!: ElementRef;

  products = signal<Product[]>([]);
  totalItems = signal(0);
  loading = signal(false);
  loadingMore = signal(false);
  hasMore = signal(true);
  error = signal(false);

  pageIndex = 0;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 25, 50];

  searchTerm = '';
  sortBy = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Control de modo de paginación
  isInfiniteScroll = false; 

  displayedColumns: string[] = ['name', 'description', 'price', 'stock', 'supplier'];
  
  private scrollObserver!: IntersectionObserver;

  constructor(public auth: AuthService, private productService: ProductService) {}

  ngOnInit(): void {
    if (this.auth.canManageProducts()) {
      this.displayedColumns = [...this.displayedColumns, 'actions'];
    }
    this.resetAndLoad();
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
    }
  }

  private setupIntersectionObserver(): void {
    this.scrollObserver = new IntersectionObserver((entries) => {
      const target = entries[0];
      // Disparar carga si el elemento es visible, hay más datos, y no estamos ya cargando
      if (target.isIntersecting && this.hasMore() && !this.loadingMore() && !this.loading() && this.isInfiniteScroll) {
        this.loadMore();
      }
    }, { rootMargin: '100px' }); // Activa 100px antes de llegar al final

    if (this.scrollTrigger?.nativeElement) {
      this.scrollObserver.observe(this.scrollTrigger.nativeElement);
    }
  }

  resetAndLoad(): void {
    this.pageIndex = 0;
    this.products.set([]);
    this.hasMore.set(true);
    this.error.set(false);
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set(false);
    
    this.productService.getProducts(this.searchTerm, this.sortBy, this.sortDirection, this.pageIndex + 1, this.pageSize)
      .subscribe({
        next: (res) => {
          if (this.pageIndex === 0 || !this.isInfiniteScroll) {
            this.products.set(res.items); // Reemplaza en paginación tradicional o primera carga
          } else {
            this.products.update(current => [...current, ...res.items]); // Agrega en scroll infinito
          }
          
          this.totalItems.set(res.totalItems);
          this.hasMore.set(res.hasMore);
          this.loading.set(false);
          this.loadingMore.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
          this.loadingMore.set(false);
        }
      });
  }

  loadMore(): void {
    if (this.loadingMore() || !this.hasMore()) return;
    this.loadingMore.set(true);
    this.pageIndex++;
    this.loadProducts();
  }

  onSearchChange(): void {
    this.resetAndLoad();
  }

  onSortChange(sort: Sort): void {
    this.sortBy = sort.active;
    this.sortDirection = sort.direction === 'desc' ? 'desc' : 'asc';
    this.resetAndLoad();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadProducts();
  }

  onModeChange(): void {
    this.resetAndLoad();
  }

  deleteProduct(id: string): void {
    if (confirm('¿Eliminar producto?')) {
      this.productService.deleteProduct(id).subscribe(() => this.resetAndLoad());
    }
  }
}