import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CatalogProductService } from '../../../../core/services/catalog-product.service';
import { CatalogCategoryService } from '../../../../core/services/catalog-category.service';
import { CatalogCategory } from '../../../../core/models/catalog.model';

@Component({
  selector: 'app-catalog-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './catalog-product-form.component.html',
  styleUrls: ['./catalog-product-form.component.css']
})
export class CatalogProductFormComponent implements OnInit {
  isEditMode = false;
  productId: string | null = null;
  loading = false;
  categories: CatalogCategory[] = [];

  formData = {
    name: '',
    description: '',
    price: 0,
    stock: 0,
    isActive: true,
    categoryId: '' as string | null
  };

  constructor(
    private productService: CatalogProductService,
    private categoryService: CatalogCategoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => (this.categories = categories)
    });

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
          categoryId: product.categoryId || ''
        };
        this.loading = false;
      },
      error: () => this.router.navigate(['/catalog/products'])
    });
  }

  onSubmit(): void {
    this.loading = true;
    const payload = { ...this.formData, categoryId: this.formData.categoryId || null };

    if (this.isEditMode && this.productId) {
      this.productService.updateProduct(this.productId, payload).subscribe({
        next: () => this.router.navigate(['/catalog/products']),
        error: () => (this.loading = false)
      });
    } else {
      this.productService.createProduct(payload).subscribe({
        next: () => this.router.navigate(['/catalog/products']),
        error: () => (this.loading = false)
      });
    }
  }
}
