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
      <div style="font-weight: bold;">Gestión Empresarial</div>
      <div style="display: flex; align-items: center; gap: 16px;">
        <a routerLink="/products" style="color: #fff;">Productos</a>
        <a routerLink="/suppliers" style="color: #fff;">Proveedores</a>
        <a routerLink="/invoices" style="color: #fff;">Facturas</a>
        <span>{{ auth.currentUser()?.name }} (<strong>{{ auth.role() }}</strong>)</span>
        <button (click)="auth.logout()" class="btn" style="background: #ef4444; color: white;">Salir</button>
      </div>
    </nav>
    <main>
      <router-outlet></router-outlet>
    </main>
  `
})
export class AppComponent {
  constructor(public auth: AuthService) {}
}
