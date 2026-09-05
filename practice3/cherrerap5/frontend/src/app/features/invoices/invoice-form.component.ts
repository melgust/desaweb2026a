import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { InvoiceService } from '../../core/services/invoice.service';
import { SupplierService } from '../../core/services/supplier.service';
import { ProductService } from '../../core/services/product.service';
import { InvoicePayload } from '../../core/models/invoice.model';
import { Supplier } from '../../core/models/supplier.model';
import { Product } from '../../core/models/product.model';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container"><header class="header"><h2>{{ id ? 'Edit' : 'Add' }} Invoice</h2><a routerLink="/invoices" class="btn">Back</a></header>
      <form (ngSubmit)="save()" #form="ngForm">
        <div class="form-row"><div class="form-group col"><label>Invoice number</label><input class="form-control" name="number" [(ngModel)]="data.number" required></div>
          <div class="form-group col"><label>Status</label><select class="form-control" name="status" [(ngModel)]="data.status"><option value="Pending">Pending</option><option value="Paid">Paid</option><option value="Cancelled">Cancelled</option></select></div></div>
        <div class="form-row"><div class="form-group col"><label>Supplier</label><select class="form-control" name="supplierId" [(ngModel)]="data.supplierId" required><option value="" disabled>Select a supplier</option><option *ngFor="let s of suppliers" [value]="s.id">{{ s.name }}</option></select></div>
          <div class="form-group col"><label>Product</label><select class="form-control" name="productId" [(ngModel)]="data.productId" required (ngModelChange)="selectProduct($event)"><option value="" disabled>Select a product</option><option *ngFor="let p of products" [value]="p.id">{{ p.name }}</option></select></div></div>
        <div class="form-row"><div class="form-group col"><label>Invoice date</label><input class="form-control" type="date" name="invoiceDate" [(ngModel)]="data.invoiceDate" required></div><div class="form-group col"><label>Due date</label><input class="form-control" type="date" name="dueDate" [(ngModel)]="data.dueDate"></div></div>
        <div class="form-row"><div class="form-group col"><label>Quantity</label><input class="form-control" type="number" min="1" name="quantity" [(ngModel)]="data.quantity" required></div><div class="form-group col"><label>Unit price</label><input class="form-control" type="number" min="0" step="0.01" name="unitPrice" [(ngModel)]="data.unitPrice" required></div><div class="form-group col"><label>Total</label><input class="form-control" [value]="data.quantity * data.unitPrice | number:'1.2-2'" disabled></div></div>
        <div class="form-group"><label>Notes</label><textarea class="form-control" name="notes" [(ngModel)]="data.notes" rows="3"></textarea></div>
        <p *ngIf="error" class="error-message">{{ error }}</p><button class="btn btn-primary" [disabled]="form.invalid || saving">Save Invoice</button>
      </form>
    </div>`
})
export class InvoiceFormComponent implements OnInit {
  id: string | null = null; suppliers: Supplier[] = []; products: Product[] = []; saving = false; error = '';
  data: InvoicePayload = { number: '', supplierId: '', productId: '', invoiceDate: new Date().toISOString().slice(0, 10), dueDate: null, quantity: 1, unitPrice: 0, status: 'Pending', notes: '' };
  constructor(private invoices: InvoiceService, private supplierService: SupplierService, private productService: ProductService, private route: ActivatedRoute, private router: Router) {}
  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    forkJoin({ suppliers: this.supplierService.getAll(), products: this.productService.getProducts(undefined, 'name', 'asc', 1, 100) }).subscribe({
      next: result => { this.suppliers = result.suppliers.filter(x => x.isActive); this.products = result.products.items.filter(x => x.isActive); },
      error: () => this.error = 'Form data could not be loaded.'
    });
    if (this.id) this.invoices.getById(this.id).subscribe({ next: i => this.data = { number: i.number, supplierId: i.supplierId, productId: i.productId, invoiceDate: i.invoiceDate.slice(0, 10), dueDate: i.dueDate?.slice(0, 10) ?? null, quantity: i.quantity, unitPrice: i.unitPrice, status: i.status, notes: i.notes ?? '' }, error: () => this.router.navigate(['/invoices']) });
  }
  selectProduct(id: string): void { const product = this.products.find(x => x.id === id); if (product && !this.id) this.data.unitPrice = product.price; }
  save(): void { this.saving = true; const request = this.id ? this.invoices.update(this.id, this.data) : this.invoices.create(this.data); request.subscribe({ next: () => this.router.navigate(['/invoices']), error: () => { this.error = 'Invoice could not be saved. Check the number and entered data.'; this.saving = false; } }); }
}
