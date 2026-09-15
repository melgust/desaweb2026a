import { Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { Order } from '../../core/models/order.model';

@Component({
  standalone: true, imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.css']
})
export class OrderComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  busy = false; error = ''; notice = ''; quantities: Partial<Record<string, number>> = {};
  get hasChanges() { return this.order?.items.some(item => (this.quantities[item.productId] ?? item.quantity) !== item.quantity) ?? false; }
  validQuantity(value: number) { return Number.isInteger(value) && value >= 1 && value <= 100000; }
  adjust(id: string, original: number, delta: number) {
    const current = this.quantities[id] ?? original;
    this.quantities[id] = Math.min(100000, Math.max(1, (Number.isFinite(current) ? current : original) + delta));
  }
  get order() { return this.orders.currentOrder(); }
  get frozen() { return this.order?.status === 'CONFIRMING'; }
  get canConfirm() { return this.auth.hasAnyRole(['Admin', 'Manager']); }
  constructor(public orders: OrderService, private auth: AuthService, private router: Router) {}
  ngOnInit() {
    this.load();
    interval(30000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => { if (!document.hidden) this.refresh(); });
  }
  @HostListener('window:focus') refresh() { if (!this.busy) this.load(); }
  load() {
    this.error = '';
    this.busy = true;
    this.orders.getCurrentOrder().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.busy = false; }, error: error => this.failed(error)
    });
  }
  private failed(error: HttpErrorResponse) {
    this.busy = false;
    this.error = error.error?.message ?? 'No se pudo completar la operación. Reintenta.';
    if ([404, 409, 503].includes(error.status)) {
      this.orders.getCurrentOrder().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ error: () => {} });
    }
  }
  change(request: Observable<Order>, message = 'Pedido actualizado.', productId?: string) {
    this.busy = true; this.error = ''; this.notice = '';
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.busy = false; if (productId) delete this.quantities[productId]; this.notice = message; }, error: error => this.failed(error)
    });
  }
  update(id: string, quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) { this.error = 'La cantidad debe ser un entero entre 1 y 100000.'; return; }
    this.change(this.orders.updateItem(id, quantity), 'Cantidad guardada. El total se ha actualizado.', id);
  }
  clear() {
    if (!window.confirm('¿Deseas vaciar el pedido?')) return;
    this.busy = true; this.error = ''; this.notice = '';
    this.orders.clearOrder().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => { this.busy = false; this.quantities = {}; }, error: error => this.failed(error) });
  }
  confirm() {
    if (this.hasChanges || this.busy) return;
    if (!window.confirm('¿Deseas confirmar este pedido y generar una factura con todos sus productos?')) return;
    this.busy = true; this.error = '';
    this.orders.confirmOrder().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => { this.busy = false; this.router.navigate(['/invoices', result.invoice.id], { state: { orderConfirmed: true } }); },
      error: error => this.failed(error)
    });
  }
}
