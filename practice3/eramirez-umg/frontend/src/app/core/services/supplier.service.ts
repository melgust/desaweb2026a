import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Supplier } from '../models/supplier.model';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly apiUrl = `${environment.apiUrl}/suppliers`;

  constructor(private http: HttpClient) {}

  getSuppliers(): Observable<Supplier[]> { return this.http.get<Supplier[]>(this.apiUrl); }
  getSupplierById(id: string): Observable<Supplier> { return this.http.get<Supplier>(`${this.apiUrl}/${id}`); }
  createSupplier(supplier: Partial<Supplier>): Observable<Supplier> { return this.http.post<Supplier>(this.apiUrl, supplier); }
  updateSupplier(id: string, supplier: Partial<Supplier>): Observable<Supplier> { return this.http.put<Supplier>(`${this.apiUrl}/${id}`, supplier); }
  deleteSupplier(id: string): Observable<void> { return this.http.delete<void>(`${this.apiUrl}/${id}`); }
}
