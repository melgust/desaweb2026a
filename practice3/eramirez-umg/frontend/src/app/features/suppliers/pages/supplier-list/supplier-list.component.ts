import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { Supplier } from '../../../../core/models/supplier.model';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container">
      <header class="header"><h2>Suppliers</h2><a *ngIf="auth.canManageSuppliers()" routerLink="/suppliers/new" class="btn btn-primary">+ Add Supplier</a></header>
      <input class="search-bar" placeholder="Search suppliers..." [(ngModel)]="searchTerm" />
      <table class="grid-table"><thead><tr><th>Name</th><th>Tax ID</th><th>Email</th><th>Phone</th><th>Status</th><th *ngIf="auth.canManageSuppliers()">Actions</th></tr></thead>
      <tbody><tr *ngFor="let supplier of filteredSuppliers"><td>{{ supplier.name }}</td><td>{{ supplier.taxId }}</td><td>{{ supplier.email || '-' }}</td><td>{{ supplier.phone || '-' }}</td><td>{{ supplier.isActive ? 'Active' : 'Inactive' }}</td><td *ngIf="auth.canManageSuppliers()"><a [routerLink]="['/suppliers/edit', supplier.id]">Edit</a> <button *ngIf="auth.canDeleteSuppliers()" class="text-danger" (click)="deleteSupplier(supplier.id)">Delete</button></td></tr></tbody></table>
      <p *ngIf="!loading && filteredSuppliers.length === 0">No suppliers found.</p><p *ngIf="loading">Loading suppliers...</p>
    </div>`
})
export class SupplierListComponent implements OnInit {
  suppliers: Supplier[] = [];
  searchTerm = '';
  loading = true;
  constructor(public auth: AuthService, private supplierService: SupplierService) {}
  get filteredSuppliers(): Supplier[] { const term = this.searchTerm.toLowerCase(); return this.suppliers.filter(s => `${s.name} ${s.taxId} ${s.email || ''}`.toLowerCase().includes(term)); }
  ngOnInit(): void { this.loadSuppliers(); }
  loadSuppliers(): void { this.loading = true; this.supplierService.getSuppliers().subscribe({ next: suppliers => { this.suppliers = suppliers; this.loading = false; }, error: () => this.loading = false }); }
  deleteSupplier(id: string): void { if (confirm('Delete supplier?')) this.supplierService.deleteSupplier(id).subscribe({ next: () => this.loadSuppliers(), error: () => alert('Supplier cannot be deleted while it has invoices.') }); }
}
