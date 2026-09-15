import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { CartService } from './core/services/cart.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav *ngIf="auth.isAuthenticated()" class="app-nav" aria-label="Main navigation">
      <div style="font-weight: bold;">Enterprise Management</div>
      <div class="nav-links">
        <a routerLink="/products" style="color: #fff;">Products</a>
        <a routerLink="/suppliers" style="color: #fff;">Suppliers</a>
        <a routerLink="/invoices" style="color: #fff;">Invoices</a>
        <a *ngIf="auth.canManageInvoices()" routerLink="/cart" class="cart-link" routerLinkActive="active" [attr.aria-label]="'Shopping cart, ' + (carts.error() ? 'unavailable' : carts.count() + ' units')">Cart ({{ carts.error() ? '—' : (carts.loading() && !carts.cart() ? '…' : carts.count()) }})</a>
        <span>{{ auth.currentUser()?.name }} (<strong>{{ auth.role() }}</strong>)</span>
        <button (click)="auth.logout()" class="btn" style="background: #ef4444; color: white;">Logout</button>
      </div>
    </nav>
    <main>
      <router-outlet></router-outlet>
    </main>
  `
})
export class AppComponent {
  constructor(public auth: AuthService, public carts: CartService) {}
}
