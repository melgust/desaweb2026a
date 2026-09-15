import { Injectable, computed, effect, signal, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, defer, finalize, interval, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cart } from '../models/cart.model';
import { apiErrorMessage } from '../models/api-error';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly apiUrl = `${environment.cartApiUrl}/me`;
  private readonly cartState = signal<Cart | null>(null);
  private sequence = 0;
  readonly cart = this.cartState.asReadonly();
  readonly count = computed(() => this.cart()?.totalQuantity ?? 0);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');

  constructor(private http: HttpClient, private auth: AuthService) {
    effect(onCleanup => {
      const user = this.auth.currentUser();
      untracked(() => {
        this.sequence++;
        this.cartState.set(null);
        this.error.set('');
        this.loading.set(false);
        if (!user) return;
        const request = this.getCart().subscribe({ error: () => {} });
        const timer = interval(60000).subscribe(() => {
          if (!this.busy()) this.getCart().subscribe({ error: () => {} });
        });
        onCleanup(() => { request.unsubscribe(); timer.unsubscribe(); });
      });
    }, { allowSignalWrites: true });
  }

  getCart(): Observable<Cart> {
    return defer(() => {
      const sequence = ++this.sequence;
      const token = this.auth.getToken();
      this.loading.set(true);
      return this.http.get<Cart>(this.apiUrl).pipe(
        tap({
          next: cart => {
            if (sequence === this.sequence && token === this.auth.getToken()) {
              this.cartState.set(cart); this.error.set('');
            }
          },
          error: error => {
            if (sequence === this.sequence && token === this.auth.getToken())
              this.error.set(apiErrorMessage(error, 'Could not load the cart.'));
          }
        }),
        finalize(() => { if (sequence === this.sequence) this.loading.set(false); })
      );
    });
  }

  addItem(productId: string, quantity: number): Observable<Cart> {
    return this.mutate(this.http.post<Cart>(`${this.apiUrl}/items`, { productId, quantity }));
  }
  updateItem(productId: string, quantity: number): Observable<Cart> {
    return this.mutate(this.http.put<Cart>(`${this.apiUrl}/items/${encodeURIComponent(productId)}`, { quantity }));
  }
  removeItem(productId: string): Observable<Cart> {
    return this.mutate(this.http.delete<Cart>(`${this.apiUrl}/items/${encodeURIComponent(productId)}`));
  }
  clearCart(version?: string): Observable<void> {
    return this.mutate(this.http.delete<void>(this.apiUrl, {
      headers: version ? { 'If-Match': version } : {}
    }));
  }

  private mutate<T extends Cart | void>(request: Observable<T>): Observable<T> {
    return defer(() => {
      if (this.busy()) return throwError(() => new Error('A cart update is already in progress.'));
      const token = this.auth.getToken();
      ++this.sequence; // Invalidate older GET responses.
      this.loading.set(false);
      this.busy.set(true);
      this.error.set('');
      return request.pipe(
        tap({
          next: result => {
            if (token !== this.auth.getToken()) return;
            ++this.sequence;
            this.loading.set(false);
            this.cartState.set(result || {
              cartId: this.cart()?.cartId || '', items: [], subtotal: 0,
              totalQuantity: 0, updatedAt: null, version: null
            });
          },
          error: error => {
            if (token === this.auth.getToken())
              this.error.set(apiErrorMessage(error, 'Could not update the cart.'));
          }
        }),
        finalize(() => this.busy.set(false))
      );
    });
  }
}