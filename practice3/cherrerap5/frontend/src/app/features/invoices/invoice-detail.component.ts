import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { InvoiceService } from '../../core/services/invoice.service';
import { AuthService } from '../../core/services/auth.service';
import { Invoice } from '../../core/models/invoice.model';

@Component({
  standalone: true, imports: [CommonModule, RouterModule],
  template: `
    <section class="container">
      <header class="header"><h2>Detalle de factura</h2><a routerLink="/invoices" class="btn">Ver facturas</a></header>
      <p *ngIf="confirmed" role="status">Pedido confirmado. La factura se generó correctamente.</p>
      <p *ngIf="error" class="error-message" role="alert">{{ error }}</p>
      <ng-container *ngIf="invoice">
        <h3>{{ invoice.number }}</h3><p>Fecha: {{ invoice.invoiceDate | date:'mediumDate' }} · Estado: {{ invoice.status }}</p>
        <p *ngIf="invoice.dueDate">Vencimiento: {{ invoice.dueDate | date:'mediumDate' }}</p>
        <div style="overflow-x:auto"><table class="grid-table"><thead><tr><th>Producto</th><th>Proveedor</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead>
          <tbody><tr *ngFor="let item of invoice.items"><td>{{ item.productName }}</td><td>{{ item.supplierName }}</td><td>{{ item.quantity }}</td><td>{{ item.unitPrice | number:'1.2-2' }}</td><td>{{ item.subtotal | number:'1.2-2' }}</td></tr></tbody>
        </table></div>
        <p>Subtotal: {{ invoice.subtotal | number:'1.2-2' }}</p><p><strong>Total: {{ invoice.total | number:'1.2-2' }}</strong></p>
        <p *ngIf="invoice.notes">{{ invoice.notes }}</p>
        <a *ngIf="auth.canManageProducts()" class="btn" [routerLink]="['/invoices/edit', invoice.id]">Editar factura</a>
      </ng-container>
    </section>`
})
export class InvoiceDetailComponent implements OnInit {
  invoice: Invoice | null = null; error = ''; confirmed = !!history.state?.orderConfirmed;
  constructor(private service: InvoiceService, private route: ActivatedRoute, public auth: AuthService) {}
  ngOnInit() {
    this.service.getById(this.route.snapshot.paramMap.get('id')!).subscribe({ next: invoice => this.invoice = invoice, error: () => this.error = 'La factura no existe o no se pudo cargar.' });
  }
}
