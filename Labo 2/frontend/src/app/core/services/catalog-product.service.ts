import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CatalogProduct, CatalogProductPagedResult } from '../models/catalog.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CatalogProductService {
  private readonly apiUrl = `${environment.catalogApiUrl}/products`;

  constructor(private http: HttpClient) {}

  getProducts(
    search: string,
    sortBy: string,
    sortDirection: string,
    page: number,
    pageSize: number
  ): Observable<CatalogProductPagedResult> {
    let params = new HttpParams()
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection)
      .set('page', page)
      .set('pageSize', pageSize);

    if (search) params = params.set('search', search);

    return this.http.get<CatalogProductPagedResult>(this.apiUrl, { params });
  }

  getProductById(id: string): Observable<CatalogProduct> {
    return this.http.get<CatalogProduct>(`${this.apiUrl}/${id}`);
  }

  createProduct(product: Partial<CatalogProduct>): Observable<CatalogProduct> {
    return this.http.post<CatalogProduct>(this.apiUrl, product);
  }

  updateProduct(id: string, product: Partial<CatalogProduct>): Observable<CatalogProduct> {
    return this.http.put<CatalogProduct>(`${this.apiUrl}/${id}`, product);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
