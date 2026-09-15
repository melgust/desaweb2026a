import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { OrderService } from './core/services/order.service';

@Component({
  selector: 'app-root', standalone: true, imports: [CommonModule, RouterModule],
  template: `
    <nav *ngIf="auth.isAuthenticated()" class="app-nav" aria-label="Navegación principal">
      <div class="nav-main"><a class="brand" routerLink="/products">Enterprise<span>Gestión de compras</span></a>
        <div class="nav-links"><a routerLink="/products" routerLinkActive="active" class="nav-link">Productos</a><a routerLink="/suppliers" routerLinkActive="active" class="nav-link">Proveedores</a><a routerLink="/invoices" routerLinkActive="active" class="nav-link">Facturas</a><a routerLink="/orders" routerLinkActive="active" class="nav-link">Pedidos ({{ orders.itemCount() }})</a></div>
      </div>
      <div class="nav-user"><span>{{ auth.currentUser()?.name }}<small>{{ auth.role() }}</small></span><button (click)="auth.logout()" class="logout-button">Salir</button></div>
    </nav>
    <main><router-outlet></router-outlet></main>`,
  styles: [`
    :host{display:block;min-width:0;}.app-nav{max-width:1200px;margin:0 auto 32px;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:18px 24px;border-radius:12px;background:#172437;color:white;}.nav-main{display:flex;align-items:center;gap:32px;min-width:0;}.brand{text-decoration:none;color:#fff;font-size:18px;letter-spacing:-.5px;font-weight:700;flex-shrink:0;}.brand span{display:block;font-size:10px;font-weight:400;letter-spacing:.5px;color:#94a3b8;margin-top:4px;}.nav-links{display:flex;gap:5px;flex-wrap:wrap;}.nav-link{color:#cbd5e1;text-decoration:none;font-size:13px;padding:10px 12px;border-radius:7px;white-space:nowrap;}.nav-link:hover{background:#243449;color:white;}.nav-link.active{background:#34465e;color:white;}.nav-user{display:flex;align-items:center;gap:16px;min-width:0;font-size:12px;}.nav-user>span{overflow-wrap:anywhere;text-align:right;}.nav-user small{display:block;color:#94a3b8;margin-top:4px;}.logout-button{padding:8px 12px;border:1px solid #526176;border-radius:6px;background:transparent;color:#e2e8f0;cursor:pointer;}main{min-width:0;}
    @media(max-width:1050px){.app-nav{flex-wrap:wrap;gap:18px;}.nav-main{flex:1;flex-wrap:wrap;gap:14px;}.nav-links{width:100%;}.nav-user{margin-left:auto;}}@media(max-width:600px){.app-nav{padding:18px 14px;margin-bottom:22px;}.nav-main{flex-basis:100%;}.nav-links{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;}.nav-link{text-align:center;}.nav-user{justify-content:space-between;width:100%;border-top:1px solid #34465e;padding-top:14px;}.nav-user>span{text-align:left;}}
  `]
})
export class AppComponent {
  constructor(public auth: AuthService, public orders: OrderService) {}
}
