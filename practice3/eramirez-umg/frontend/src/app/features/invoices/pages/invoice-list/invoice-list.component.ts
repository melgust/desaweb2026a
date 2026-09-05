import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { InvoiceService } from '../../../../core/services/invoice.service';
import { Invoice } from '../../../../core/models/invoice.model';

@Component({ selector: 'app-invoice-list', standalone: true, imports: [CommonModule, FormsModule, RouterModule], template: `
<div class="container"><header class="header"><h2>Invoices</h2><a *ngIf="auth.canManageInvoices()" routerLink="/invoices/new" class="btn btn-primary">+ Add Invoice</a></header>
<div class="form-row"><input class="search-bar col" placeholder="Search by number or supplier..." [(ngModel)]="search" (keyup.enter)="loadInvoices()" /><select class="form-control col" [(ngModel)]="status" (change)="loadInvoices()"><option value="">All statuses</option><option value="Pending">Pending</option><option value="Paid">Paid</option><option value="Cancelled">Cancelled</option></select></div>
<table class="grid-table"><thead><tr><th>Number</th><th>Supplier</th><th>Issue date</th><th>Total</th><th>Status</th><th *ngIf="auth.canManageInvoices()">Actions</th></tr></thead><tbody><tr *ngFor="let invoice of invoices"><td>{{ invoice.number }}</td><td>{{ invoice.supplierName }}</td><td>{{ invoice.issueDate | date:'mediumDate' }}</td><td>&dollar;{{ invoice.total | number:'1.2-2' }}</td><td>{{ invoice.status }}</td><td *ngIf="auth.canManageInvoices()"><a [routerLink]="['/invoices/edit', invoice.id]">Edit</a> <button *ngIf="auth.canDeleteInvoices()" class="text-danger" (click)="deleteInvoice(invoice.id)">Delete</button></td></tr></tbody></table>
<p *ngIf="!loading && invoices.length === 0">No invoices found.</p><p *ngIf="loading">Loading invoices...</p><div class="pagination" *ngIf="totalPages > 0"><button [disabled]="page <= 1" (click)="setPage(page - 1)">Prev</button><span>Page {{ page }} of {{ totalPages }}</span><button [disabled]="page >= totalPages" (click)="setPage(page + 1)">Next</button></div></div>` })
export class InvoiceListComponent implements OnInit {
  invoices: Invoice[] = []; search = ''; status = ''; page = 1; totalPages = 0; loading = true;
  constructor(public auth: AuthService, private service: InvoiceService) {}
  ngOnInit(): void { this.loadInvoices(); }
  loadInvoices(): void { this.loading = true; this.service.getInvoices(this.search, this.status, this.page).subscribe({ next: r => { this.invoices = r.items; this.totalPages = r.totalPages; this.loading = false; }, error: () => this.loading = false }); }
  setPage(page: number): void { this.page = page; this.loadInvoices(); }
  deleteInvoice(id: string): void { if (confirm('Delete invoice?')) this.service.deleteInvoice(id).subscribe(() => this.loadInvoices()); }
}
