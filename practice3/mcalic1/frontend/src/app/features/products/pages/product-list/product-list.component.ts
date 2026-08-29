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

  searchTerm = '';
  sortBy = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(public auth: AuthService, private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.productService.getProducts(this.searchTerm, this.sortBy, this.sortDirection, this.page()).subscribe({
      next: (res) => {
        this.products.set(res.items);
        this.totalItems.set(res.totalItems);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearchChange(): void {
    this.page.set(1);
    this.loadProducts();
  }

  toggleSort(column: string): void {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
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
}