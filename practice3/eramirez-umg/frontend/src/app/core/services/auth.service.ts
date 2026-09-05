import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, User } from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private currentUserSignal = signal<User | null>(this.getStoredUser());

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly role = computed(() => this.currentUserSignal()?.role);
  
  readonly isAdmin = computed(() => this.role() === 'Admin');
  readonly canManageProducts = computed(() => this.isAdmin() || this.role() === 'Manager');
  readonly canDeleteProducts = computed(() => this.isAdmin());
  readonly canManageSuppliers = computed(() => this.isAdmin() || this.role() === 'Manager');
  readonly canDeleteSuppliers = computed(() => this.isAdmin());
  readonly canManageInvoices = computed(() => this.isAdmin() || this.role() === 'Manager');
  readonly canDeleteInvoices = computed(() => this.isAdmin());

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        const user: User = { name: res.name, email: res.email, role: res.role };
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUserSignal.set(user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  hasAnyRole(allowedRoles: string[]): boolean {
    const currentRole = this.role();
    return !!currentRole && allowedRoles.includes(currentRole);
  }

  private getStoredUser(): User | null {
    const data = localStorage.getItem(this.USER_KEY);
    return data ? JSON.parse(data) : null;
  }
}