import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { InvoiceService } from '../../../../core/services/invoice.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { CartService } from '../../../../core/services/cart.service';
import { Supplier } from '../../../../core/models/supplier.model';
import { Invoice, InvoiceDetail } from '../../../../core/models/invoice.model';
import { apiErrorMessage } from '../../../../core/models/api-error';
import { CartItemsComponent } from '../../../cart/components/cart-items.component';

@Component({
  selector: 'app-invoice-form', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CartItemsComponent],
  templateUrl: './invoice-form.component.html'
})
export class InvoiceFormComponent implements OnInit {
  isEditMode = false;
  loading = true;
  loadFailed = false;
  saving = false;
  clearing = false;
  invoiceId: string | null = null;
  suppliers: Supplier[] = [];
  details: InvoiceDetail[] = [];
  error = '';
  cleanupError = '';
  cartChanged = false;
  savedInvoice: Invoice | null = null;
  private savedCartVersion: string | null = null;
  formData = { supplierId: '', number: '', issueDate: new Date().toISOString().slice(0, 10), dueDate: '', subtotal: 0, tax: 0, status: 'Pending', notes: '' };

  constructor(private invoiceService: InvoiceService, private supplierService: SupplierService,
    public carts: CartService, private route: ActivatedRoute, private router: Router) {}

  get subtotal(): number {
    if (!this.isEditMode) return this.carts.cart()?.subtotal || 0;
    return this.details.length ? this.details.reduce((sum, item) => sum + item.subtotal, 0) : Number(this.formData.subtotal || 0);
  }
  get total(): number { return this.subtotal + Number(this.formData.tax || 0); }

  ngOnInit(): void {
    this.invoiceId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.invoiceId;
    const tax = Number(this.route.snapshot.queryParamMap.get('tax'));
    if (Number.isFinite(tax) && tax >= 0) this.formData.tax = tax;
    void this.load();
  }

  async load(): Promise<void> {
    this.loading = true; this.loadFailed = false; this.error = '';
    try {
      this.suppliers = (await firstValueFrom(this.supplierService.getSuppliers())).filter(s => s.isActive);
      if (this.invoiceId) {
        const invoice = await firstValueFrom(this.invoiceService.getInvoiceById(this.invoiceId));
        this.formData = { supplierId: invoice.supplierId, number: invoice.number, issueDate: invoice.issueDate.slice(0, 10),
          dueDate: invoice.dueDate?.slice(0, 10) || '', subtotal: invoice.subtotal, tax: invoice.tax, status: invoice.status, notes: invoice.notes || '' };
        this.details = invoice.details || [];
        if (!this.suppliers.some(s => s.id === invoice.supplierId))
          this.suppliers.push({ id: invoice.supplierId, name: invoice.supplierName, taxId: '', isActive: true, createdAt: '' });
      } else {
        await firstValueFrom(this.carts.getCart());
      }
    } catch (error) { this.loadFailed = true; this.error = apiErrorMessage(error, 'Could not load invoice data. Please retry.'); }
    finally { this.loading = false; }
  }

  async refreshCart(): Promise<void> {
    this.error = '';
    try { await firstValueFrom(this.carts.getCart()); }
    catch (error) { this.error = apiErrorMessage(error, 'Could not refresh the cart.'); }
  }

  async onSubmit(): Promise<void> {
    if (this.saving || this.savedInvoice || this.carts.busy()) return;
    this.saving = true; this.error = '';
    const header = {
      supplierId: this.formData.supplierId, number: this.formData.number.trim(),
      issueDate: this.formData.issueDate, dueDate: this.formData.dueDate || undefined,
      tax: this.formData.tax, status: this.formData.status, notes: this.formData.notes
    };
    try {
      if (this.isEditMode && this.invoiceId) {
        await firstValueFrom(this.invoiceService.updateInvoice(this.invoiceId, { ...header, subtotal: this.subtotal }));
        await this.router.navigate(['/invoices', this.invoiceId]);
        return;
      }
      const displayedVersion = this.carts.cart()?.version;
      const latest = await firstValueFrom(this.carts.getCart());
      if (!latest.items.length || !latest.version) {
        this.error = 'Your cart is empty or expired. Add products before creating an invoice.'; return;
      }
      if (latest.version !== displayedVersion) {
        this.error = 'Your cart changed. Review the updated products and submit again.'; return;
      }
      this.savedCartVersion = latest.version;
      this.savedInvoice = await firstValueFrom(this.invoiceService.createInvoice({
        ...header, items: latest.items.map(item => ({ productId: item.productId, quantity: item.quantity }))
      }));
    } catch (error) {
      this.error = apiErrorMessage(error, 'Could not confirm the invoice. Your cart has been kept. Check the invoice list before retrying if the connection was interrupted.');
      return;
    } finally { this.saving = false; }
    await this.finishCheckout();
  }

  async finishCheckout(): Promise<void> {
    if (!this.savedInvoice || !this.savedCartVersion || this.clearing || this.cartChanged) return;
    this.clearing = true; this.cleanupError = '';
    try {
      await firstValueFrom(this.carts.clearCart(this.savedCartVersion));
      await this.router.navigate(['/invoices', this.savedInvoice.id], { queryParams: { created: '1' } });
    } catch (error) {
      this.cartChanged = error instanceof HttpErrorResponse && error.status === 409;
      this.cleanupError = this.cartChanged
        ? 'The cart changed while this invoice was being saved. Its current items have been kept. Review them before creating another invoice.'
        : 'The invoice is saved, but the cart could not be emptied. Retry emptying it here; this will not create another invoice.';
      if (this.cartChanged) this.carts.getCart().subscribe({ error: () => {} });
    } finally { this.clearing = false; }
  }
}
