import { Component, OnInit, ViewChild, signal } from '@angular/core';
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
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  @ViewChild(MatSort) sort!: MatSort;

  products = signal<Product[]>([]);
  totalItems = signal(0);
  loading = signal(false);

  // Server-side paging state (MatPaginator is zero-based).
  pageIndex = 0;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 25, 50];

  searchTerm = '';
  sortBy = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  displayedColumns: string[] = ['name', 'description', 'price', 'stock', 'supplier'];
  // displayedColumns: string[] = ['name', 'description', 'price', 'Category', 'stock', 'supplier'];

  constructor(public auth: AuthService, private productService: ProductService) {}

  ngOnInit(): void {
    if (this.auth.canManageProducts()) {
      this.displayedColumns = [...this.displayedColumns, 'actions'];
    }
    this.loadProducts();
  }
loadProducts(): void {
  const products: Product[] = [
    {
      id: '1',
      name: 'Laptop Lenovo IdeaPad',
      description: 'Laptop para trabajo y estudio',
      price: 4500,
      stock: 15,
      isActive: true,
      createdAt: '2026-08-01T10:00:00',
      supplierId: '1',
      supplierName: 'Distribuidora Tech'
    },
    {
      id: '2',
      name: 'Mouse inalámbrico Logitech',
      description: 'Mouse inalámbrico ergonómico',
      price: 185,
      stock: 35,
      isActive: true,
      createdAt: '2026-08-03T14:30:00',
      supplierId: '2',
      supplierName: 'Tecnología GT'
    },
    {
      id: '3',
      name: 'Teclado mecánico',
      description: 'Teclado mecánico RGB',
      price: 650,
      stock: 20,
      isActive: true,
      createdAt: '2026-08-05T09:15:00',
      supplierId: '2',
      supplierName: 'Tecnología GT'
    },
    {
      id: '4',
      name: 'Monitor Samsung 24"',
      description: 'Monitor Full HD de 24 pulgadas',
      price: 1250,
      stock: 10,
      isActive: true,
      createdAt: '2026-08-07T11:45:00',
      supplierId: '3',
      supplierName: 'Importadora Digital'
    },
    {
      id: '5',
      name: 'Cable HDMI',
      description: 'Cable HDMI de 2 metros',
      price: 75,
      stock: 50,
      isActive: true,
      createdAt: '2026-08-10T16:20:00',
      supplierId: '1',
      supplierName: 'Distribuidora Tech'
    },
    {
      id: '6',
      name: 'Memoria USB 64GB',
      description: 'Memoria USB 3.0 de 64GB',
      price: 95,
      stock: 40,
      isActive: true,
      createdAt: '2026-08-12T08:30:00',
      supplierId: '3',
      supplierName: 'Importadora Digital'
    },
    {
      id: '7',
      name: 'Disco SSD 1TB',
      description: 'Unidad SSD NVMe de 1TB',
      price: 850,
      stock: 8,
      isActive: true,
      createdAt: '2026-08-15T13:10:00',
      supplierId: '3',
      supplierName: 'Importadora Digital'
    },
    {
      id: '8',
      name: 'Webcam HD',
      description: 'Cámara web HD para videoconferencias',
      price: 320,
      stock: 0,
      isActive: false,
      createdAt: '2026-08-18T15:00:00',
      supplierId: '2',
      supplierName: 'Tecnología GT'
    }
  ];

  this.products.set(products);
}
  onSearchChange(): void {
    this.pageIndex = 0;
    this.loadProducts();
  }

  onSortChange(sort: Sort): void {
    this.sortBy = sort.active;
    this.sortDirection = sort.direction === 'desc' ? 'desc' : 'asc';
    this.pageIndex = 0;
    this.loadProducts();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadProducts();
  }
  onTableScroll(event: Event): void {
  const element = event.target as HTMLElement;

  const atBottom =
    element.scrollTop + element.clientHeight >= element.scrollHeight - 5;

  if (atBottom) {
    element.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}
  deleteProduct(id: string): void {
    if (confirm('Delete product?')) {
      this.productService.deleteProduct(id).subscribe(() => this.loadProducts());
    }
  }
}
