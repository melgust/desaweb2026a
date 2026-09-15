import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../../core/services/product.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Product } from '../../../../core/models/product.model';
import { Category } from '../../../../core/models/category.model';
import { CategoryService } from '../../../../core/services/category.service';
import { OrderService } from '../../../../core/services/order.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { Supplier } from '../../../../core/models/supplier.model';

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
  loadError = signal('');
  categories = signal<Category[]>([]);
  paginationMode: 'offset' | 'infinite' = 'offset';
  readonly pageSize = 10;

  searchTerm = '';
  categoryId = '';
  sortBy = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedProduct: Product | null = null;
  suppliers: Supplier[] = [];
  supplierId = ''; orderQuantity = 1; orderBusy = false; orderError = ''; orderSuccess = '';

  constructor(
    public auth: AuthService,
    private productService: ProductService,
    private categoryService: CategoryService,
    public orders: OrderService,
    private supplierService: SupplierService
  ) {}

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe(categories => this.categories.set(categories));
    this.loadProducts();
  }

  prepareOrder(product: Product): void {
    this.selectedProduct = product; this.orderQuantity = 1; this.orderError = ''; this.orderSuccess = '';
    this.supplierId = this.orders.currentOrder()?.items.find(i => i.productId === product.id)?.supplierId ?? '';
    this.supplierService.getAll().subscribe({ next: suppliers => this.suppliers = suppliers.filter(s => s.isActive), error: () => this.orderError = 'No se pudieron cargar los proveedores.' });
  }

  addToOrder(): void {
    if (!this.selectedProduct || !this.supplierId || !Number.isInteger(this.orderQuantity) || this.orderQuantity < 1 || this.orderQuantity > 100000) {
      this.orderError = 'Selecciona proveedor y una cantidad entera entre 1 y 100000.'; return;
    }
    this.orderBusy = true; this.orderError = '';
    this.orders.addItem(this.selectedProduct.id, this.supplierId, this.orderQuantity).subscribe({
      next: () => { this.orderBusy = false; this.orderSuccess = 'Producto agregado al pedido.'; this.selectedProduct = null; },
      error: error => { this.orderBusy = false; this.orderError = error.error?.message ?? 'No se pudo agregar el producto.'; }
    });
  }

  loadProducts(): void {
    if (this.loading()) return;
    this.loadError.set('');
    this.loading.set(true);
    this.productService.getProducts(this.searchTerm, this.sortBy, this.sortDirection, this.page(), this.pageSize, this.categoryId).subscribe({
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
      error: (error) => {
        this.loading.set(false);
        this.loadError.set(error.status === 401
          ? 'Your session expired. Log out and sign in again.'
          : 'Products could not be loaded. Please try again.');
      }
    });
  }

  onSearchChange(): void {
    this.resetAndLoad();
  }

  onCategoryChange(): void {
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
