import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Supplier, SupplierPagedResult } from '../models/supplier.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly apiUrl = `${environment.apiUrl}/suppliers`;

  constructor(private http: HttpClient) {}

  getSuppliers(
    search?: string,
    sortBy?: string,
    sortDirection?: string,
    page: number = 1,
    pageSize: number = 10
  ): Observable<SupplierPagedResult> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (search) params = params.set('search', search);
    if (sortBy) params = params.set('sortBy', sortBy);
    if (sortDirection) params = params.set('sortDirection', sortDirection);

    return this.http.get<SupplierPagedResult>(this.apiUrl, { params });
  }

  /** Lightweight list of active suppliers for dropdowns. */
  getAllSuppliers(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(`${this.apiUrl}/all`);
  }

  getSupplierById(id: string): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.apiUrl}/${id}`);
  }

  createSupplier(supplier: Partial<Supplier>): Observable<Supplier> {
    return this.http.post<Supplier>(this.apiUrl, supplier);
  }

  updateSupplier(id: string, supplier: Partial<Supplier>): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.apiUrl}/${id}`, supplier);
  }

  deleteSupplier(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
