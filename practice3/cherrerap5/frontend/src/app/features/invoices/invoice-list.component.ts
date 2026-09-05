import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InvoiceService } from '../../core/services/invoice.service';
import { AuthService } from '../../core/services/auth.service';
import { Invoice } from '../../core/models/invoice.model';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container">
      <header class="header"><h2>Supplier Invoices</h2><a *ngIf="auth.canManageProducts()" routerLink="/invoices/new" class="btn btn-primary">+ Add Invoice</a></header>
      <p *ngIf="error()" class="error-message">{{ error() }}</p>
      <table class="grid-table"><thead><tr><th>Number</th><th>Supplier</th><th>Product</th><th>Date</th><th>Qty.</th><th>Total</th><th>Status</th><th *ngIf="auth.canManageProducts()">Actions</th></tr></thead>
        <tbody><tr *ngFor="let invoice of invoices()"><td>{{ invoice.number }}</td><td>{{ invoice.supplierName }}</td><td>{{ invoice.productName }}</td>
          <td>{{ invoice.invoiceDate | date:'mediumDate' }}</td><td>{{ invoice.quantity }}</td><td>{{ invoice.total | currency }}</td><td><span class="status" [attr.data-status]="invoice.status">{{ invoice.status }}</span></td>
          <td *ngIf="auth.canManageProducts()"><a [routerLink]="['/invoices/edit', invoice.id]">Edit</a><button *ngIf="auth.canDeleteProducts()" class="text-danger" (click)="remove(invoice.id)">Delete</button></td>
        </tr></tbody></table>
      <p *ngIf="!loading() && !invoices().length">No invoices registered.</p>
    </div>`
})
export class InvoiceListComponent implements OnInit {
  invoices = signal<Invoice[]>([]); loading = signal(true); error = signal('');
  constructor(public auth: AuthService, private service: InvoiceService) {}
  ngOnInit(): void { this.load(); }
  load(): void { this.loading.set(true); this.service.getAll().subscribe({ next: x => { this.invoices.set(x); this.loading.set(false); }, error: () => { this.error.set('Invoices could not be loaded.'); this.loading.set(false); } }); }
  remove(id: string): void { if (confirm('Delete invoice?')) this.service.delete(id).subscribe({ next: () => this.load(), error: () => this.error.set('Invoice could not be deleted.') }); }
}
