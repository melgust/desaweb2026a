import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav *ngIf="auth.isAuthenticated()" style="background: #1e293b; color: #fff; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <div style="display:flex; align-items:center; gap:24px"><strong>Enterprise Management</strong><a routerLink="/products" class="nav-link">Products</a><a routerLink="/suppliers" class="nav-link">Suppliers</a><a routerLink="/invoices" class="nav-link">Invoices</a></div>
      <div style="display: flex; align-items: center; gap: 16px;">
        <span>{{ auth.currentUser()?.name }} (<strong>{{ auth.role() }}</strong>)</span>
        <button (click)="auth.logout()" class="btn" style="background: #ef4444; color: white;">Logout</button>
      </div>
    </nav>
    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`.nav-link { color: #e2e8f0; text-decoration: none; } .nav-link:hover { color: #fff; }`]
})
export class AppComponent {
  constructor(public auth: AuthService) {}
}
