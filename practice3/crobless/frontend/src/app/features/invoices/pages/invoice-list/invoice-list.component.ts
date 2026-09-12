import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InvoiceService } from '../../../../core/services/invoice.service';
import { AuthService } from '../../../../core/services/auth.service';
import { apiError } from '../../../../core/services/api-error';
import { Invoice } from '../../../../core/models/invoice.model';

@Component({
  selector: 'app-invoice-list', standalone: true, imports: [CommonModule, RouterModule],
  templateUrl: './invoice-list.component.html'
})
export class InvoiceListComponent implements OnInit {
  invoices = signal<Invoice[]>([]);
  loading = false;
  deleting: string | null = null;
  error = '';
  constructor(private service: InvoiceService, public auth: AuthService) {}
  ngOnInit() { this.load(); }
  load() {
    this.loading = true;
    this.error = '';
    this.service.getAll().subscribe({
      next: items => { this.invoices.set(items); this.loading = false; },
      error: err => { this.error = apiError(err); this.loading = false; }
    });
  }
  delete(invoice: Invoice) {
    if (this.deleting || !confirm(`¿Eliminar la factura ${invoice.invoiceNumber}?`)) return;
    this.deleting = invoice.id;
    this.service.delete(invoice.id).subscribe({
      next: () => { this.deleting = null; this.load(); },
      error: err => { this.deleting = null; this.error = apiError(err); }
    });
  }
}
