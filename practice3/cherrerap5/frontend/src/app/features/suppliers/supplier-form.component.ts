import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SupplierService } from '../../core/services/supplier.service';
import { SupplierPayload } from '../../core/models/supplier.model';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container"><header class="header"><h2>{{ id ? 'Edit' : 'Add' }} Supplier</h2><a routerLink="/suppliers" class="btn">Back</a></header>
      <form (ngSubmit)="save()" #form="ngForm">
        <div class="form-row"><div class="form-group col"><label>Name</label><input class="form-control" name="name" [(ngModel)]="data.name" required></div><div class="form-group col"><label>Tax ID</label><input class="form-control" name="taxId" [(ngModel)]="data.taxId"></div></div>
        <div class="form-row"><div class="form-group col"><label>Contact name</label><input class="form-control" name="contactName" [(ngModel)]="data.contactName"></div><div class="form-group col"><label>Email</label><input class="form-control" type="email" name="email" [(ngModel)]="data.email"></div></div>
        <div class="form-row"><div class="form-group col"><label>Phone</label><input class="form-control" name="phone" [(ngModel)]="data.phone"></div><div class="form-group col"><label>Address</label><input class="form-control" name="address" [(ngModel)]="data.address"></div></div>
        <label class="checkbox-group"><input type="checkbox" name="isActive" [(ngModel)]="data.isActive"> Active</label>
        <p *ngIf="error" class="error-message">{{ error }}</p><button class="btn btn-primary" [disabled]="form.invalid || saving">Save Supplier</button>
      </form>
    </div>`
})
export class SupplierFormComponent implements OnInit {
  id: string | null = null; saving = false; error = '';
  data: SupplierPayload = { name: '', taxId: '', contactName: '', email: '', phone: '', address: '', isActive: true };
  constructor(private service: SupplierService, private route: ActivatedRoute, private router: Router) {}
  ngOnInit(): void { this.id = this.route.snapshot.paramMap.get('id'); if (this.id) this.service.getById(this.id).subscribe({ next: s => this.data = { name: s.name, taxId: s.taxId, contactName: s.contactName, email: s.email, phone: s.phone, address: s.address, isActive: s.isActive }, error: () => this.router.navigate(['/suppliers']) }); }
  save(): void { this.saving = true; const request = this.id ? this.service.update(this.id, this.data) : this.service.create(this.data); request.subscribe({ next: () => this.router.navigate(['/suppliers']), error: () => { this.error = 'Supplier could not be saved. Check the entered data.'; this.saving = false; } }); }
}
