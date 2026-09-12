import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="wrapper" [class.authenticated]="auth.isAuthenticated()">
      <nav *ngIf="auth.isAuthenticated()" class="main-header navbar navbar-expand navbar-dark">
        <span class="navbar-brand mb-0 h1 pl-3">Enterprise Management</span>
        <ul class="navbar-nav mr-auto">
          <li class="nav-item">
            <a class="nav-link" routerLink="/products" routerLinkActive="active">Products</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/suppliers" routerLinkActive="active">Suppliers</a>
          </li>
        </ul>
        <ul class="navbar-nav ml-auto align-items-center pr-3">
          <li class="nav-item text-light mr-3">
            {{ auth.currentUser()?.name }} (<strong>{{ auth.role() }}</strong>)
          </li>
          <li class="nav-item">
            <button (click)="auth.logout()" class="btn btn-danger btn-sm">Logout</button>
          </li>
        </ul>
      </nav>

      <div class="content-wrapper">
        <section class="content pt-3">
          <div class="container-fluid">
            <router-outlet></router-outlet>
          </div>
        </section>
      </div>
    </div>
  `
})
export class AppComponent {
  constructor(public auth: AuthService) {}
}