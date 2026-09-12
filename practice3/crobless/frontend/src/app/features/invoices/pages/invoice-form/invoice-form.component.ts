import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { InvoiceService } from '../../../../core/services/invoice.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { ProductService } from '../../../../core/services/product.service';
import { AuthService } from '../../../../core/services/auth.service';
import { apiError } from '../../../../core/services/api-error';
import { Supplier } from '../../../../core/models/supplier.model';
import { Product } from '../../../../core/models/product.model';
import { Invoice, InvoiceDetailRequest } from '../../../../core/models/invoice.model';

@Component({
  selector: 'app-invoice-form', standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './invoice-form.component.html', styleUrls: ['./invoice-form.component.css']
})
export class InvoiceFormComponent implements OnInit {
  private fb = inject(FormBuilder).nonNullable;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(InvoiceService);
  private supplierService = inject(SupplierService);
  private productService = inject(ProductService);
  private auth = inject(AuthService);
  id = this.route.snapshot.paramMap.get('id');
  readonlyMode = this.route.snapshot.data['readonly'] === true || !this.auth.canManageProducts();
  loading = true;
  saving = false;
  ready = false;
  error = '';
  taxRate = 0;
  savedInvoice: Invoice | null = null;
  suppliers: Supplier[] = [];
  products: Product[] = [];
  form = this.fb.group({
    invoiceNumber: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/\S/)]],
    invoiceDate: [this.today(), [Validators.required, Validators.minLength(10)]],
    supplierId: ['', Validators.required],
    notes: ['', Validators.maxLength(2000)],
    items: this.fb.array([this.createItem()], [Validators.minLength(1), Validators.maxLength(500)])
  });
  get items() { return this.form.controls.items; }
  private today() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  private createItem(item?: InvoiceDetailRequest) {
    return this.fb.group({
      productId: [item?.productId ?? '', Validators.required],
      quantity: [item?.quantity ?? 1, [Validators.required, Validators.min(1), Validators.max(2147483647), Validators.pattern(/^\d+$/)]],
      unitPrice: [item?.unitPrice ?? 0, [Validators.required, Validators.min(0), Validators.max(9999999999999999), Validators.pattern(/^\d+(\.\d{1,2})?$/)]]
    });
  }
  ngOnInit() {
    forkJoin({
      suppliers: this.supplierService.getAllSuppliers(), products: this.productService.getAllProducts(),
      settings: this.service.getSettings(), invoice: this.id ? this.service.getById(this.id) : of(null)
    }).subscribe({
      next: ({ suppliers, products, settings, invoice }) => {
        this.suppliers = suppliers;
        this.products = products;
        this.taxRate = settings.taxRate;
        if (invoice) {
          this.savedInvoice = invoice;
          // Keep the historical supplier selectable even after deactivation.
          if (!suppliers.some(s => s.id === invoice.supplierId)) {
            this.suppliers.push({ id: invoice.supplierId, name: invoice.supplierName, isActive: false, createdAt: '' });
          }
          this.form.patchValue({ ...invoice, notes: invoice.notes ?? '' });
          this.items.clear();
          invoice.items.forEach(item => this.items.push(this.createItem(item)));
        }
        if (this.readonlyMode) this.form.disable();
        this.loading = false;
        this.ready = true;
      },
      error: err => { this.error = apiError(err); this.loading = false; }
    });
  }
  addItem() { if (this.items.length < 500) this.items.push(this.createItem()); }
  removeItem(index: number) { if (this.items.length > 1) this.items.removeAt(index); }
  selectProduct(index: number) {
    const row = this.items.at(index);
    const product = this.products.find(p => p.id === row.controls.productId.value);
    if (product) row.controls.unitPrice.setValue(product.price);
  }
  lineSubtotal(index: number) {
    const item = this.items.at(index).getRawValue();
    return this.round(item.quantity * item.unitPrice);
  }
  private round(value: number) { return Math.round((value + Number.EPSILON) * 100) / 100; }
  get subtotal() {
    if (this.readonlyMode && this.savedInvoice) return this.savedInvoice.subtotal;
    return this.round(this.items.controls.reduce((sum, _, index) => sum + this.lineSubtotal(index), 0));
  }
  get tax() { return this.readonlyMode && this.savedInvoice ? this.savedInvoice.tax : this.round(this.subtotal * this.taxRate); }
  get total() { return this.readonlyMode && this.savedInvoice ? this.savedInvoice.total : this.round(this.subtotal + this.tax); }
  save() {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.ready || this.saving || this.readonlyMode) return;
    this.saving = true;
    this.error = '';
    const request = this.form.getRawValue();
    request.invoiceNumber = request.invoiceNumber.trim();
    (this.id ? this.service.update(this.id, request) : this.service.create(request)).subscribe({
      next: () => this.router.navigate(['/invoices']),
      error: err => { this.error = apiError(err); this.saving = false; }
    });
  }
}
