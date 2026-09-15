import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { InvoiceService } from '../../core/services/invoice.service';
import { SupplierService } from '../../core/services/supplier.service';
import { ProductService } from '../../core/services/product.service';
import { InvoiceItemPayload, InvoicePayload } from '../../core/models/invoice.model';
import { Supplier } from '../../core/models/supplier.model';
import { Product } from '../../core/models/product.model';

@Component({
  standalone: true, imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <section class="container">
      <header class="header"><h2>{{ id ? 'Editar' : 'Crear' }} factura</h2><a routerLink="/invoices" class="btn">Volver</a></header>
      <form (ngSubmit)="save()" #form="ngForm">
        <div class="form-row">
          <div class="form-group col"><label for="number">Número</label><input id="number" class="form-control" name="number" [(ngModel)]="data.number" maxlength="255" required></div>
          <div class="form-group col"><label for="status">Estado</label><select id="status" class="form-control" name="status" [(ngModel)]="data.status"><option value="Pending">Pending</option><option value="Paid">Paid</option><option value="Cancelled">Cancelled</option></select></div>
          <div class="form-group col"><label for="date">Fecha</label><input id="date" class="form-control" type="date" name="date" [(ngModel)]="data.invoiceDate" required></div>
          <div class="form-group col"><label for="due">Vencimiento</label><input id="due" class="form-control" type="date" name="due" [(ngModel)]="data.dueDate"></div>
        </div>
        <h3>Productos</h3>
        <div style="overflow-x:auto"><table class="grid-table">
          <thead><tr><th>Producto</th><th>Proveedor</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th><th>Acción</th></tr></thead>
          <tbody><tr *ngFor="let item of data.items; let index = index">
            <td><select class="form-control" [name]="'product-' + index" [(ngModel)]="item.productId" (ngModelChange)="selectProduct(item)" [attr.aria-label]="'Producto ' + (index + 1)" required><option value="">Seleccionar</option><option *ngFor="let product of products" [value]="product.id">{{ product.name }}{{ product.isActive ? '' : ' (inactivo)' }}</option></select></td>
            <td><select class="form-control" [name]="'supplier-' + index" [(ngModel)]="item.supplierId" [attr.aria-label]="'Proveedor ' + (index + 1)" required><option value="">Seleccionar</option><option *ngFor="let supplier of suppliers" [value]="supplier.id">{{ supplier.name }}{{ supplier.isActive ? '' : ' (inactivo)' }}</option></select></td>
            <td><input class="form-control" type="number" [name]="'quantity-' + index" [(ngModel)]="item.quantity" min="1" max="100000" step="1" [attr.aria-label]="'Cantidad ' + (index + 1)" required></td>
            <td><input class="form-control" type="number" [name]="'price-' + index" [(ngModel)]="item.unitPrice" min="0" max="100000000" step="0.01" [attr.aria-label]="'Precio ' + (index + 1)" required></td>
            <td>{{ lineTotal(item) | number:'1.2-2' }}</td>
            <td><button type="button" class="btn" (click)="data.items.splice(index, 1)" [disabled]="saving || data.items.length === 1">Eliminar línea</button></td>
          </tr></tbody>
        </table></div>
        <button type="button" class="btn" (click)="addLine()" [disabled]="saving || data.items.length >= 100">Agregar producto</button>
        <p><strong>Total: {{ total | number:'1.2-2' }}</strong></p>
        <div class="form-group"><label for="notes">Notas</label><textarea id="notes" class="form-control" name="notes" [(ngModel)]="data.notes" rows="3"></textarea></div>
        <p *ngIf="error" class="error-message" role="alert">{{ error }}</p>
        <button class="btn btn-primary" [disabled]="form.invalid || saving || loading">Guardar factura</button>
      </form>
    </section>`
})
export class InvoiceFormComponent implements OnInit {
  id: string | null = null; suppliers: Supplier[] = []; products: Product[] = [];
  saving = false; loading = true; error = '';
  data: InvoicePayload = { number: '', invoiceDate: new Date().toISOString().slice(0, 10), dueDate: null, items: [], status: 'Pending', notes: '' };
  constructor(private invoices: InvoiceService, private supplierService: SupplierService, private productService: ProductService, private route: ActivatedRoute, private router: Router) {}
  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    forkJoin({ suppliers: this.supplierService.getAll(), products: this.productService.getAllProducts() }).subscribe({
      next: result => {
        this.suppliers = result.suppliers; this.products = result.products;
        if (this.id) this.loadInvoice(this.id); else { this.addLine(); this.loading = false; }
      }, error: () => { this.error = 'No se pudo cargar el catálogo. Recarga para reintentar.'; }
    });
  }
  private loadInvoice(id: string) {
    this.invoices.getById(id).subscribe({
      next: invoice => {
        this.data = { number: invoice.number, invoiceDate: invoice.invoiceDate.slice(0, 10), dueDate: invoice.dueDate?.slice(0, 10) ?? null,
          items: invoice.items.map(item => ({ productId: item.productId, supplierId: item.supplierId, quantity: item.quantity, unitPrice: item.unitPrice })), status: invoice.status, notes: invoice.notes ?? '' };
        this.loading = false;
      }, error: () => { this.error = 'No se pudo cargar la factura.'; }
    });
  }
  addLine() { this.data.items.push({ productId: '', supplierId: '', quantity: 1, unitPrice: 0 }); }
  selectProduct(item: InvoiceItemPayload) { item.unitPrice = this.products.find(p => p.id === item.productId)?.price ?? 0; }
  lineTotal(item: InvoiceItemPayload) { return Math.round(item.unitPrice * 100) * item.quantity / 100; }
  get total() { return this.data.items.reduce((sum, item) => sum + Math.round(this.lineTotal(item) * 100), 0) / 100; }
  save() {
    if (this.data.items.some(i => !Number.isInteger(i.quantity) || i.quantity < 1)) { this.error = 'Las cantidades deben ser enteros positivos.'; return; }
    if (new Set(this.data.items.map(i => i.productId)).size !== this.data.items.length) { this.error = 'Agrupa cada producto en una sola línea.'; return; }
    this.saving = true; this.error = '';
    const payload = { ...this.data, dueDate: this.data.dueDate || null };
    const request = this.id ? this.invoices.update(this.id, payload) : this.invoices.create(payload);
    request.subscribe({ next: invoice => this.router.navigate(['/invoices', invoice.id]), error: error => { this.error = error.error?.message ?? 'No se pudo guardar la factura.'; this.saving = false; } });
  }
}
