import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InvoiceService } from '../../../../core/services/invoice.service';
import { Invoice } from '../../../../core/models/invoice.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({ selector: 'app-invoice-list', standalone: true, imports: [CommonModule, RouterModule], templateUrl: './invoice-list.component.html' })
export class InvoiceListComponent implements OnInit {
  invoices = signal<Invoice[]>([]); loading = signal(true); error = '';
  constructor(public auth: AuthService, private invoiceService: InvoiceService) {}
  ngOnInit(): void { this.invoiceService.getAll().subscribe({ next: x => { this.invoices.set(x); this.loading.set(false); }, error: e => { this.error = e.error?.error || 'No se pudieron cargar las facturas.'; this.loading.set(false); } }); }
}
