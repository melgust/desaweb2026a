import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { InvoiceDetail } from '../../../../core/models/invoice.model';
import { Product } from '../../../../core/models/product.model';
import { Supplier } from '../../../../core/models/supplier.model';
import { InvoiceService } from '../../../../core/services/invoice.service';
import { ProductService } from '../../../../core/services/product.service';
import { SupplierService } from '../../../../core/services/supplier.service';

@Component({ selector: 'app-invoice-form', standalone: true, imports: [CommonModule, FormsModule, RouterModule], templateUrl: './invoice-form.component.html' })
export class InvoiceFormComponent implements OnInit {
  suppliers: Supplier[] = []; products: Product[] = []; loading = true; saving = false; error = '';
  formData = { invoiceNumber: '', supplierId: '', invoiceDate: new Date().toISOString().slice(0, 10), details: [{ productId: '', quantity: 1, unitPrice: 0 }] as InvoiceDetail[] };
  constructor(private invoiceService: InvoiceService, private supplierService: SupplierService, private productService: ProductService, private router: Router) {}
  ngOnInit(): void { forkJoin({ suppliers: this.supplierService.getAll(), products: this.productService.getProducts('', 'name', 'asc', 1, 100) }).subscribe({ next: data => { this.suppliers = data.suppliers.filter(s => s.isActive); this.products = data.products.items.filter(p => p.isActive); this.loading = false; }, error: () => { this.error = 'No se pudieron cargar los proveedores o productos.'; this.loading = false; } }); }
  addDetail(): void { this.formData.details.push({ productId: '', quantity: 1, unitPrice: 0 }); }
  removeDetail(index: number): void { if (this.formData.details.length > 1) this.formData.details.splice(index, 1); }
  total(): number { return this.formData.details.reduce((sum, d) => sum + (Number(d.quantity) || 0) * (Number(d.unitPrice) || 0), 0); }
  submit(): void { if (this.formData.details.some(d => !d.productId || d.quantity < 1 || d.unitPrice <= 0)) { this.error = 'Selecciona un producto e ingresa cantidad y precio positivos en cada detalle.'; return; } this.saving = true; this.error = ''; this.invoiceService.create(this.formData).subscribe({ next: () => this.router.navigate(['/invoices']), error: e => { this.error = e.error?.error || 'No se pudo registrar la factura.'; this.saving = false; } }); }
}
