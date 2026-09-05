import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupplierService } from '../../core/services/supplier.service';
import { AuthService } from '../../core/services/auth.service';
import { Supplier } from '../../core/models/supplier.model';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container">
      <header class="header"><h2>Suppliers</h2><a *ngIf="auth.canManageProducts()" routerLink="/suppliers/new" class="btn btn-primary">+ Add Supplier</a></header>
      <p *ngIf="error()" class="error-message">{{ error() }}</p>
      <table class="grid-table">
        <thead><tr><th>Name</th><th>Tax ID</th><th>Contact</th><th>Email</th><th>Phone</th><th>Status</th><th *ngIf="auth.canManageProducts()">Actions</th></tr></thead>
        <tbody><tr *ngFor="let supplier of suppliers()">
          <td>{{ supplier.name }}</td><td>{{ supplier.taxId || '-' }}</td><td>{{ supplier.contactName || '-' }}</td>
          <td>{{ supplier.email || '-' }}</td><td>{{ supplier.phone || '-' }}</td><td>{{ supplier.isActive ? 'Active' : 'Inactive' }}</td>
          <td *ngIf="auth.canManageProducts()"><a [routerLink]="['/suppliers/edit', supplier.id]">Edit</a><button *ngIf="auth.canDeleteProducts()" class="text-danger" (click)="remove(supplier.id)">Delete</button></td>
        </tr></tbody>
      </table>
      <p *ngIf="!loading() && !suppliers().length">No suppliers registered.</p>
    </div>`
})
export class SupplierListComponent implements OnInit {
  suppliers = signal<Supplier[]>([]); loading = signal(true); error = signal('');
  constructor(public auth: AuthService, private service: SupplierService) {}
  ngOnInit(): void { this.load(); }
  load(): void { this.loading.set(true); this.service.getAll().subscribe({ next: x => { this.suppliers.set(x); this.loading.set(false); }, error: () => { this.error.set('Suppliers could not be loaded.'); this.loading.set(false); } }); }
  remove(id: string): void { if (confirm('Delete supplier?')) this.service.delete(id).subscribe({ next: () => this.load(), error: () => this.error.set('The supplier could not be deleted. It may have invoices.') }); }
}
