import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { Category } from '../../../../core/models/product.model';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
export class ProductFormComponent implements OnInit {
  isEditMode = false;
  productId: string | null = null;
  loading = false;
  categories: Category[] = [];

  formData = {
    name: '',
    description: '',
    price: 0,
    stock: 0,
    isActive: true,
    categoryId: ''
  };

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    this.productService.getCategories().subscribe({ next: categories => this.categories = categories });
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
          categoryId: product.categoryId || ''
        };
        this.loading = false;
      },
      error: () => this.router.navigate(['/products'])
    });
  }

  onSubmit(): void {
    this.loading = true;
    if (this.isEditMode && this.productId) {
      this.productService.updateProduct(this.productId, this.formData).subscribe({
        next: () => this.router.navigate(['/products']),
        error: () => (this.loading = false)
      });
    } else {
      this.productService.createProduct(this.formData).subscribe({
        next: () => this.router.navigate(['/products']),
        error: () => (this.loading = false)
      });
    }
  }
}