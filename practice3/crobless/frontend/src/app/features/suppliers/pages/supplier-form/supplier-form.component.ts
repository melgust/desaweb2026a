import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { apiError } from '../../../../core/services/api-error';
import { SupplierService } from '../../../../core/services/supplier.service';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule
  ],
  templateUrl: './supplier-form.component.html',
  styleUrls: ['./supplier-form.component.css']
})
export class SupplierFormComponent implements OnInit {
  isEditMode = false;
  supplierId: string | null = null;
  loading = false;
  error = '';
  loadFailed = false;

  formData = {
    name: '',
    contactEmail: '',
    phone: '',
    isActive: true
  };

  constructor(
    private supplierService: SupplierService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.supplierId = this.route.snapshot.paramMap.get('id');
    if (this.supplierId) {
      this.isEditMode = true;
      this.loadSupplier(this.supplierId);
    }
  }

  loadSupplier(id: string): void {
    this.loading = true;
    this.supplierService.getSupplierById(id).subscribe({
      next: (supplier) => {
        this.formData = {
          name: supplier.name,
          contactEmail: supplier.contactEmail || '',
          phone: supplier.phone || '',
          isActive: supplier.isActive
        };
        this.loading = false;
      },
      error: err => { this.error = apiError(err); this.loading = false; this.loadFailed = true; }
    });
  }

  onSubmit(form: NgForm): void {
    if (form.invalid || this.loading || this.loadFailed || !this.formData.name.trim()) return;
    this.formData.name = this.formData.name.trim();
    this.loading = true;
    this.error = '';
    const payload = { ...this.formData, contactEmail: this.formData.contactEmail.trim() || undefined };
    const request$ = this.isEditMode && this.supplierId
      ? this.supplierService.updateSupplier(this.supplierId, payload)
      : this.supplierService.createSupplier(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/suppliers']),
      error: err => { this.error = apiError(err); this.loading = false; }
    });
  }
}
