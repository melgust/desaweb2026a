import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InvoiceService } from '../../core/services/invoice.service';
import { AuthService } from '../../core/services/auth.service';
import { Invoice } from '../../core/models/invoice.model';

@Component({
  standalone: true, imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './invoice-list.component.html', styleUrls: ['./invoice-list.component.css']
})
export class InvoiceListComponent implements OnInit {
  invoices = signal<Invoice[]>([]); loading = signal(true); error = signal('');
  search = signal(''); status = signal('');
  filteredInvoices = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    return this.invoices().filter(invoice => (!this.status() || invoice.status === this.status()) &&
      (!query || invoice.number.toLocaleLowerCase().includes(query) || invoice.items.some(item => `${item.productName} ${item.supplierName}`.toLocaleLowerCase().includes(query))));
  });
  constructor(public auth: AuthService, private service: InvoiceService) {}
  ngOnInit(): void { this.load(); }
  quantity(invoice: Invoice) { return invoice.items.reduce((sum, item) => sum + item.quantity, 0); }
  statusLabel(status: string) { return ({ Pending: 'Pendiente', Paid: 'Pagada', Cancelled: 'Cancelada' } as Record<string, string>)[status] ?? status; }
  load(): void {
    this.loading.set(true); this.error.set('');
    this.service.getAll().subscribe({ next: x => { this.invoices.set(x); this.loading.set(false); }, error: () => { this.error.set('No se pudieron cargar las facturas.'); this.loading.set(false); } });
  }
  remove(id: string): void {
    if (confirm('¿Deseas eliminar esta factura?')) this.service.delete(id).subscribe({ next: () => this.load(), error: () => this.error.set('No se pudo eliminar la factura.') });
  }
}
