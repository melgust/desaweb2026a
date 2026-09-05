import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SupplierService } from '../../../../core/services/supplier.service';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container"><header class="header"><h2>{{ isEditMode ? 'Edit Supplier' : 'New Supplier' }}</h2><a routerLink="/suppliers" class="btn">Back to List</a></header>
      <form (ngSubmit)="onSubmit()" *ngIf="!loading; else wait"><div class="form-row"><div class="form-group col"><label>Name</label><input class="form-control" name="name" [(ngModel)]="formData.name" required /></div><div class="form-group col"><label>Tax ID</label><input class="form-control" name="taxId" [(ngModel)]="formData.taxId" required /></div></div>
      <div class="form-row"><div class="form-group col"><label>Email</label><input type="email" class="form-control" name="email" [(ngModel)]="formData.email" /></div><div class="form-group col"><label>Phone</label><input class="form-control" name="phone" [(ngModel)]="formData.phone" /></div></div>
      <div class="form-group"><label>Address</label><input class="form-control" name="address" [(ngModel)]="formData.address" /></div><div class="form-group checkbox-group"><label><input type="checkbox" name="isActive" [(ngModel)]="formData.isActive" /> Active</label></div><button class="btn btn-primary" type="submit">{{ isEditMode ? 'Update Supplier' : 'Create Supplier' }}</button></form><ng-template #wait>Loading supplier...</ng-template>
    </div>`
})
export class SupplierFormComponent implements OnInit {
  isEditMode = false; loading = false; supplierId: string | null = null;
  formData = { name: '', taxId: '', email: '', phone: '', address: '', isActive: true };
  constructor(private service: SupplierService, private route: ActivatedRoute, private router: Router) {}
  ngOnInit(): void { this.supplierId = this.route.snapshot.paramMap.get('id'); if (this.supplierId) { this.isEditMode = true; this.loading = true; this.service.getSupplierById(this.supplierId).subscribe({ next: s => { this.formData = { name: s.name, taxId: s.taxId, email: s.email || '', phone: s.phone || '', address: s.address || '', isActive: s.isActive }; this.loading = false; }, error: () => this.router.navigate(['/suppliers']) }); } }
  onSubmit(): void { this.loading = true; const request = this.isEditMode && this.supplierId ? this.service.updateSupplier(this.supplierId, this.formData) : this.service.createSupplier(this.formData); request.subscribe({ next: () => this.router.navigate(['/suppliers']), error: () => this.loading = false }); }
}
