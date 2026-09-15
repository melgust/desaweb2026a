import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { CartItemsComponent } from '../components/cart-items.component';
import { apiErrorMessage } from '../../../core/models/api-error';

@Component({
  selector: 'app-cart', standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CartItemsComponent],
  template: `
    <div class="container">
      <header class="header"><div><h2>Shopping cart</h2><p class="muted">{{ carts.count() }} units · Saved for 24 hours after your last change</p></div><a class="btn" routerLink="/products">Continue shopping</a></header>
      <p *ngIf="message" class="notice success" role="status">{{ message }}</p>
      <p *ngIf="error" class="notice error" role="alert">{{ error }}</p>
      <div class="actions"><button class="btn" (click)="refresh()" [disabled]="carts.busy() || carts.loading()">Refresh cart</button><button class="btn btn-danger" (click)="clear()" [disabled]="carts.busy() || !carts.count()">Empty cart</button></div>
      <app-cart-items />
      <section class="totals" *ngIf="carts.count()">
        <h3>Estimated amounts</h3>
        <div><span>Subtotal</span><strong>{{ carts.cart()?.subtotal | number:'1.2-2' }}</strong></div>
        <label for="cartTax">Tax amount</label><input id="cartTax" class="form-control" type="number" min="0" step="0.01" [(ngModel)]="tax" />
        <div class="total"><span>Estimated total</span><strong>{{ total | number:'1.2-2' }}</strong></div>
        <p class="muted">Prices and availability are checked again when the invoice is saved. Products are not reserved.</p>
        <a *ngIf="!carts.busy() && !carts.loading() && !carts.error() && validTax" class="btn btn-primary" routerLink="/invoices/new" [queryParams]="{tax: tax}">Create invoice</a>
      </section>
    </div>
  `
})
export class CartComponent implements OnInit {
  tax = 0;
  message = '';
  error = '';
  constructor(public carts: CartService) {}
  get validTax(): boolean { return typeof this.tax === 'number' && Number.isFinite(this.tax) && this.tax >= 0; }
  get total(): number { return (this.carts.cart()?.subtotal || 0) + (this.validTax ? this.tax : 0); }
  ngOnInit(): void { this.refresh(); }
  refresh(): void {
    this.error = '';
    this.carts.getCart().subscribe({ error: error => this.error = apiErrorMessage(error, 'Could not load the cart.') });
  }
  clear(): void {
    const version = this.carts.cart()?.version;
    if (this.carts.busy() || !version || !confirm('Remove every product from your cart?')) return;
    this.message = ''; this.error = '';
    this.carts.clearCart(version).subscribe({
      next: () => this.message = 'Your cart is now empty.',
      error: error => { this.error = apiErrorMessage(error, 'Could not empty the cart.'); this.carts.getCart().subscribe({error: () => {}}); }
    });
  }
}
