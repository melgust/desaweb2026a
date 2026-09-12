import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CategoryService } from '../../../../core/services/category.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Category } from '../../../../core/models/category.model';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.css']
})
export class CategoryListComponent implements OnInit {
  categories = signal<Category[]>([]);
  loading = signal(false);
  errorMessage = signal('');

  constructor(public auth: AuthService, private categoryService: CategoryService) {}

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
        this.errorMessage.set(err?.error?.detail || err?.error?.title || 'Could not delete category (it may still have products assigned).');
      }
    });
  }
}
