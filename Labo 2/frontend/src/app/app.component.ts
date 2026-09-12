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
      <div style="font-weight: bold;">Enterprise Management</div>
      <div style="display: flex; align-items: center; gap: 16px;">
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
  constructor(public auth: AuthService) {}
}