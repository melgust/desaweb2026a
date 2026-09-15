import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { InvoiceService } from '../../../../core/services/invoice.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Invoice } from '../../../../core/models/invoice.model';
import { apiErrorMessage } from '../../../../core/models/api-error';

@Component({
  selector: 'app-invoice-detail', standalone: true, imports: [CommonModule, RouterModule],
  template: `
    <div class="container">
      <header class="header"><h2>Invoice {{ invoice?.number }}</h2><a class="btn" routerLink="/invoices">Back to List</a></header>
      <p *ngIf="created" class="notice success" role="status">Invoice saved and cart emptied successfully.</p>
      <p *ngIf="loading" role="status">Loading invoice...</p>
      <p *ngIf="error" class="notice error" role="alert">{{ error }}</p><button *ngIf="error" class="btn" (click)="load()">Retry</button>
      <ng-container *ngIf="invoice as item">
        <dl class="invoice-meta"><div><dt>Supplier</dt><dd>{{ item.supplierName }}</dd></div><div><dt>Issue date</dt><dd>{{ item.issueDate | date:'mediumDate' }}</dd></div><div><dt>Due date</dt><dd>{{ item.dueDate ? (item.dueDate | date:'mediumDate') : '—' }}</dd></div><div><dt>Status</dt><dd>{{ item.status }}</dd></div></dl>
        <div class="table-scroll" *ngIf="item.details?.length; else historical">
          <table class="grid-table"><caption>Saved product details</caption><thead><tr><th scope="col">Product</th><th scope="col">Unit price</th><th scope="col">Quantity</th><th scope="col">Subtotal</th></tr></thead><tbody><tr *ngFor="let detail of item.details"><td>{{ detail.productName }}</td><td>{{ detail.unitPrice | number:'1.2-2' }}</td><td>{{ detail.quantity }}</td><td>{{ detail.subtotal | number:'1.2-2' }}</td></tr></tbody></table>
        </div>
        <ng-template #historical><p class="empty-state">Historical invoice without product details. Its original amounts are preserved.</p></ng-template>
        <section class="totals" aria-label="Invoice totals"><div><span>Subtotal</span><strong>{{ item.subtotal | number:'1.2-2' }}</strong></div><div><span>Tax</span><strong>{{ item.tax | number:'1.2-2' }}</strong></div><div class="total"><span>Total</span><strong>{{ item.total | number:'1.2-2' }}</strong></div></section>
        <p *ngIf="item.notes" class="invoice-notes">{{ item.notes }}</p>
        <a *ngIf="auth.canManageInvoices()" class="btn" [routerLink]="['/invoices/edit', item.id]">Edit invoice information</a>
      </ng-container>
    </div>
  `
})
export class InvoiceDetailComponent implements OnInit {
  invoice: Invoice | null = null;
  error = '';
  loading = false;
  created = false;
  constructor(private service: InvoiceService, private route: ActivatedRoute, public auth: AuthService) {}
  ngOnInit(): void { this.created = this.route.snapshot.queryParamMap.get('created') === '1'; this.load(); }
  load(): void {
    this.loading = true; this.error = '';
    this.service.getInvoiceById(this.route.snapshot.paramMap.get('id')!).subscribe({
      next: invoice => { this.invoice = invoice; this.loading = false; },
      error: error => { this.error = apiErrorMessage(error, 'Could not load the invoice.'); this.loading = false; }
    });
  }
}
