import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { ProductService } from '../../../../core/services/product.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { CategoryService } from '../../../../core/services/category.service'; // <-- AGREGADO
import { Supplier } from '../../../../core/models/supplier.model';
import { Category } from '../../../../core/models/category.model'; // <-- AGREGADO

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule
  ],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
export class ProductFormComponent implements OnInit {
  isEditMode = false;
  productId: string | null = null;
  loading = false;

  suppliers = signal<Supplier[]>([]);
  categories = signal<Category[]>([]); // <-- AGREGADO: Signal para las categorías

  formData = {
    name: '',
    description: '',
    price: 0,
    stock: 0,
    isActive: true,
    supplierId: null as string | null,
    categoryId: null as string | null // <-- AGREGADO: Para guardar el ID de la categoría seleccionada
  };

  constructor(
    private productService: ProductService,
    private supplierService: SupplierService,
    private categoryService: CategoryService, // <-- AGREGADO: Inyección del servicio
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1. Cargar proveedores para el dropdown
    this.supplierService.getAllSuppliers().subscribe({
      next: (list) => this.suppliers.set(list),
      error: () => this.suppliers.set([])
    });

    // 2. Cargar categorías para el dropdown <-- AGREGADO
    this.categoryService.getAllCategories().subscribe({
      next: (list) => this.categories.set(list),
      error: () => this.categories.set([])
    });

    // 3. Verificar si estamos en modo edición
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.isEditMode = true;
      this.loadProduct(this.productId);
    }
  }

  loadProduct(id: string): void {
    this.loading = true;
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.formData = {
          name: product.name,
          description: product.description || '',
          price: product.price,
          stock: product.stock,
          isActive: product.isActive,
          supplierId: product.supplierId ?? null,
          categoryId: product.categoryId ?? null // <-- AGREGADO: Cargar la categoría existente al editar
        };
        this.loading = false;
      },
      error: () => this.router.navigate(['/products'])
    });
  }

  onSubmit(): void {
    this.loading = true;
    
    const request$ = this.isEditMode && this.productId
      ? this.productService.updateProduct(this.productId, this.formData)
      : this.productService.createProduct(this.formData);

    request$.subscribe({
      next: () => this.router.navigate(['/products']),
      error: () => (this.loading = false)
    });
  }
}