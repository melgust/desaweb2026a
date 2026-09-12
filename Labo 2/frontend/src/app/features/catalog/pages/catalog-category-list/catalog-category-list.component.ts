import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CatalogCategoryService } from '../../../../core/services/catalog-category.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CatalogCategory } from '../../../../core/models/catalog.model';

@Component({
  selector: 'app-catalog-category-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './catalog-category-list.component.html',
  styleUrls: ['./catalog-category-list.component.css']
})
export class CatalogCategoryListComponent implements OnInit {
  categories = signal<CatalogCategory[]>([]);
  loading = signal(false);
  errorMessage = signal('');

  constructor(public auth: AuthService, private categoryService: CatalogCategoryService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  deleteCategory(id: string): void {
    if (!confirm('Delete this category?')) return;

    this.errorMessage.set('');
    this.categoryService.deleteCategory(id).subscribe({
      next: () => this.loadCategories(),
      error: (err) => {
        this.errorMessage.set(err?.error?.detail || 'Could not delete category (it may still have products assigned).');
      }
    });
  }
}
