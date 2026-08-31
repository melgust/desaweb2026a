import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CategoryService } from '../../../../core/services/category.service';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.css']
})
export class CategoryFormComponent implements OnInit {
  isEditMode = false;
  categoryId: string | null = null;
  loading = false;
  errorMessage = '';

  formData = {
    name: '',
    description: ''
  };

  constructor(
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.categoryId = this.route.snapshot.paramMap.get('id');
    if (this.categoryId) {
      this.isEditMode = true;
      this.loadCategory(this.categoryId);
    }
  }

  loadCategory(id: string): void {
    this.loading = true;
    this.categoryService.getCategoryById(id).subscribe({
      next: (category) => {
        this.formData = { name: category.name, description: category.description || '' };
        this.loading = false;
      },
      error: () => this.router.navigate(['/categories'])
    });
  }

  onSubmit(): void {
    this.loading = true;
    this.errorMessage = '';

    const onError = (err: any) => {
      this.loading = false;
      this.errorMessage = err?.error?.detail || err?.error?.title || 'Could not save the category.';
    };

    if (this.isEditMode && this.categoryId) {
      this.categoryService.updateCategory(this.categoryId, this.formData).subscribe({
        next: () => this.router.navigate(['/categories']),
        error: onError
      });
    } else {
      this.categoryService.createCategory(this.formData).subscribe({
        next: () => this.router.navigate(['/categories']),
        error: onError
      });
    }
  }
}
