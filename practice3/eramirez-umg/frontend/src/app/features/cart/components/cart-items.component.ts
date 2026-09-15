import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../core/services/cart.service';
import { CartItem } from '../../../core/models/cart.model';
import { apiErrorMessage } from '../../../core/models/api-error';

@Component({
  selector: 'app-cart-items', standalone: true, imports: [CommonModule],
  template: `
    <p *ngIf="message" class="notice success" role="status">{{ message }}</p>
    <p *ngIf="error || carts.error()" class="notice error" role="alert">{{ error || carts.error() }}</p>
    <p *ngIf="carts.loading()" role="status">Refreshing cart...</p>
    <div class="table-scroll" *ngIf="carts.cart()?.items?.length">
      <table class="grid-table cart-table">
        <caption class="sr-only">Products in your cart</caption>
        <thead><tr><th scope="col">Product</th><th scope="col">Unit price</th><th scope="col">Quantity</th><th scope="col">Subtotal</th><th scope="col">Actions</th></tr></thead>
        <tbody><tr *ngFor="let item of carts.cart()?.items; trackBy: trackItem">
          <td>{{ item.name }}</td><td>{{ item.unitPrice | number:'1.2-2' }}</td>
          <td><div class="quantity-control">
            <button type="button" class="btn" [disabled]="disabled || carts.busy() || item.quantity <= 1" (click)="setQuantity(item, item.quantity - 1)" [attr.aria-label]="'Decrease quantity of ' + item.name">−</button>
            <input #quantity type="number" min="1" max="2147483647" step="1" [value]="item.quantity" [disabled]="disabled || carts.busy()" [attr.aria-label]="'Quantity of ' + item.name" (change)="setQuantity(item, quantity.valueAsNumber); quantity.value = item.quantity.toString()" />
            <button type="button" class="btn" [disabled]="disabled || carts.busy() || item.quantity >= 2147483647" (click)="setQuantity(item, item.quantity + 1)" [attr.aria-label]="'Increase quantity of ' + item.name">+</button>
          </div></td>
          <td>{{ item.subtotal | number:'1.2-2' }}</td>
          <td><button type="button" class="btn btn-danger" [disabled]="disabled || carts.busy()" (click)="remove(item)" [attr.aria-label]="'Remove ' + item.name">Remove</button></td>
        </tr></tbody>
      </table>
    </div>
    <p *ngIf="!carts.loading() && carts.cart() && !carts.cart()?.items?.length" class="empty-state">Your cart is empty. Add products to create an invoice.</p>
  `
})
export class CartItemsComponent {
  @Input() disabled = false;
  message = '';
  error = '';
  constructor(public carts: CartService) {}
  trackItem(_index: number, item: CartItem): string { return item.productId; }
  setQuantity(item: CartItem, quantity: number): void {
    if (this.disabled || this.carts.busy()) return;
    this.message = ''; this.error = '';
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 2147483647) {
      this.error = 'Enter a positive whole-number quantity.'; return;
    }
    if (quantity === item.quantity) return;
    this.carts.updateItem(item.productId, quantity).subscribe({
      next: () => this.message = `Quantity updated for ${item.name}.`,
      error: error => this.error = apiErrorMessage(error, 'Could not update the quantity.')
    });
  }
  remove(item: CartItem): void {
    if (this.disabled || this.carts.busy() || !confirm(`Remove ${item.name} from your cart?`)) return;
    this.message = ''; this.error = '';
    this.carts.removeItem(item.productId).subscribe({
      next: () => this.message = `${item.name} removed from the cart.`,
      error: error => this.error = apiErrorMessage(error, 'Could not remove the product.')
    });
  }
}
