import { Injectable, computed, effect, signal, untracked } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, defer, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConfirmOrderResult, Order } from '../models/order.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly url = `${environment.orderApiUrl}/orders`;
  private readonly state = signal<Order | null>(null);
  readonly currentOrder = this.state.asReadonly();
  readonly message = signal('');
  readonly itemCount = computed(() => this.state()?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0);

  constructor(private http: HttpClient, private auth: AuthService) {
    effect(onCleanup => {
      const user = this.auth.currentUser();
      untracked(() => { this.state.set(null); this.message.set(''); });
      if (user) {
        const subscription = untracked(() => this.getCurrentOrder().subscribe({ error: () => {} }));
        onCleanup(() => subscription.unsubscribe());
      }
    }, { allowSignalWrites: true });
  }

  getCurrentOrder(): Observable<Order | null> {
    return defer(() => {
      const token = this.auth.getToken();
      return this.http.get<Order>(`${this.url}/current`).pipe(
        tap(order => { if (token === this.auth.getToken()) { this.state.set(order); this.message.set(''); } }),
        catchError((error: HttpErrorResponse) => {
          if (error.status !== 404) return throwError(() => error);
          if (token === this.auth.getToken()) {
            const previous = this.state();
            this.message.set(previous && Date.parse(previous.expiresAt) <= Date.now()
              ? 'Tu pedido temporal expiró después de 24 horas de inactividad.'
              : 'No hay un pedido temporal activo.');
            this.state.set(null);
          }
          return of(null);
        })
      );
    });
  }

  private mutation(request: () => Observable<Order>): Observable<Order> {
    return defer(() => {
      const token = this.auth.getToken();
      return request().pipe(tap(order => {
        if (token === this.auth.getToken()) { this.state.set(order); this.message.set(''); }
      }));
    });
  }
  addItem(productId: string, supplierId: string, quantity: number) {
    return this.mutation(() => this.http.post<Order>(`${this.url}/items`, { productId, supplierId, quantity }));
  }
  updateItem(productId: string, quantity: number) {
    return this.mutation(() => this.http.put<Order>(`${this.url}/items/${encodeURIComponent(productId)}`, { quantity }));
  }
  removeItem(productId: string) {
    return this.mutation(() => this.http.delete<Order>(`${this.url}/items/${encodeURIComponent(productId)}`));
  }
  clearOrder() {
    return defer(() => {
      const token = this.auth.getToken();
      return this.http.delete<void>(`${this.url}/current`).pipe(tap(() => {
        if (token === this.auth.getToken()) { this.state.set(null); this.message.set('Pedido cancelado.'); }
      }));
    });
  }
  confirmOrder() {
    return defer(() => {
      const token = this.auth.getToken();
      return this.http.post<ConfirmOrderResult>(`${this.url}/confirm`, {}).pipe(tap(() => {
        if (token === this.auth.getToken()) { this.state.set(null); this.message.set(''); }
      }));
    });
  }
}
