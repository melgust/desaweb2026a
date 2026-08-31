import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { CategoryService } from '../../../../core/services/category.service';

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

  categories: { id: string; name: string }[] = [];

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
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.isEditMode = true;
      this.loadProduct(this.productId);
    }
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        if (!this.isEditMode && categories.length > 0) {
          this.formData.categoryId = categories[0].id;
        }
      }
    });
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
          categoryId: this.categories.find(c => c.name === product.categoryName)?.id ?? ''
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