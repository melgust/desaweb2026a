import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Supplier, SupplierPayload } from '../models/supplier.model';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly url = `${environment.apiUrl}/suppliers`;
  constructor(private http: HttpClient) {}
  getAll(): Observable<Supplier[]> { return this.http.get<Supplier[]>(this.url); }
  getById(id: string): Observable<Supplier> { return this.http.get<Supplier>(`${this.url}/${id}`); }
  create(data: SupplierPayload): Observable<Supplier> { return this.http.post<Supplier>(this.url, data); }
  update(id: string, data: SupplierPayload): Observable<Supplier> { return this.http.put<Supplier>(`${this.url}/${id}`, data); }
  delete(id: string): Observable<void> { return this.http.delete<void>(`${this.url}/${id}`); }
}
