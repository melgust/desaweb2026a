import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InvoiceService } from '../../../../core/services/invoice.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { Supplier } from '../../../../core/models/supplier.model';

@Component({ selector: 'app-invoice-form', standalone: true, imports: [CommonModule, FormsModule, RouterModule], template: `
<div class="container"><header class="header"><h2>{{ isEditMode ? 'Edit Invoice' : 'New Invoice' }}</h2><a routerLink="/invoices" class="btn">Back to List</a></header><form (ngSubmit)="onSubmit()" *ngIf="!loading; else wait">
<div class="form-row"><div class="form-group col"><label>Supplier</label><select class="form-control" name="supplierId" [(ngModel)]="formData.supplierId" required><option value="">Select supplier</option><option *ngFor="let supplier of suppliers" [value]="supplier.id">{{ supplier.name }} ({{ supplier.taxId }})</option></select></div><div class="form-group col"><label>Invoice number</label><input class="form-control" name="number" [(ngModel)]="formData.number" required /></div></div>
<div class="form-row"><div class="form-group col"><label>Issue date</label><input type="date" class="form-control" name="issueDate" [(ngModel)]="formData.issueDate" required /></div><div class="form-group col"><label>Due date</label><input type="date" class="form-control" name="dueDate" [(ngModel)]="formData.dueDate" /></div><div class="form-group col"><label>Status</label><select class="form-control" name="status" [(ngModel)]="formData.status"><option>Pending</option><option>Paid</option><option>Cancelled</option></select></div></div>
<div class="form-row"><div class="form-group col"><label>Subtotal</label><input type="number" step="0.01" min="0" class="form-control" name="subtotal" [(ngModel)]="formData.subtotal" required /></div><div class="form-group col"><label>Tax</label><input type="number" step="0.01" min="0" class="form-control" name="tax" [(ngModel)]="formData.tax" required /></div><div class="form-group col"><label>Total</label><input class="form-control" [value]="total | number:'1.2-2'" readonly /></div></div><div class="form-group"><label>Notes</label><textarea class="form-control" name="notes" rows="3" [(ngModel)]="formData.notes"></textarea></div><button class="btn btn-primary" type="submit">{{ isEditMode ? 'Update Invoice' : 'Create Invoice' }}</button></form><ng-template #wait>Loading invoice data...</ng-template></div>` })
export class InvoiceFormComponent implements OnInit {
  isEditMode = false; loading = true; invoiceId: string | null = null; suppliers: Supplier[] = [];
  formData = { supplierId: '', number: '', issueDate: new Date().toISOString().slice(0, 10), dueDate: '', subtotal: 0, tax: 0, status: 'Pending', notes: '' };
  constructor(private invoiceService: InvoiceService, private supplierService: SupplierService, private route: ActivatedRoute, private router: Router) {}
  get total(): number { return Number(this.formData.subtotal || 0) + Number(this.formData.tax || 0); }
  ngOnInit(): void { this.supplierService.getSuppliers().subscribe({ next: suppliers => { this.suppliers = suppliers.filter(s => s.isActive); this.loadInvoice(); }, error: () => this.router.navigate(['/invoices']) }); }
  loadInvoice(): void { this.invoiceId = this.route.snapshot.paramMap.get('id'); if (!this.invoiceId) { this.loading = false; return; } this.isEditMode = true; this.invoiceService.getInvoiceById(this.invoiceId).subscribe({ next: i => { this.formData = { supplierId: i.supplierId, number: i.number, issueDate: i.issueDate.slice(0, 10), dueDate: i.dueDate ? i.dueDate.slice(0, 10) : '', subtotal: i.subtotal, tax: i.tax, status: i.status, notes: i.notes || '' }; this.loading = false; }, error: () => this.router.navigate(['/invoices']) }); }
  onSubmit(): void { this.loading = true; const request = this.isEditMode && this.invoiceId ? this.invoiceService.updateInvoice(this.invoiceId, this.formData) : this.invoiceService.createInvoice(this.formData); request.subscribe({ next: () => this.router.navigate(['/invoices']), error: () => this.loading = false }); }
}
