import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
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
      error: () => this.router.navigate(['/suppliers'])
    });
  }

  onSubmit(): void {
    this.loading = true;
    const request$ = this.isEditMode && this.supplierId
      ? this.supplierService.updateSupplier(this.supplierId, this.formData)
      : this.supplierService.createSupplier(this.formData);

    request$.subscribe({
      next: () => this.router.navigate(['/suppliers']),
      error: () => (this.loading = false)
    });
  }
}
