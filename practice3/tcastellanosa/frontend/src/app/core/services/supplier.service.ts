import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Supplier } from '../models/supplier.model';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly apiUrl = `${environment.apiUrl}/suppliers`;
  constructor(private http: HttpClient) {}
  getAll(): Observable<Supplier[]> { return this.http.get<Supplier[]>(this.apiUrl); }
  getById(id: string): Observable<Supplier> { return this.http.get<Supplier>(`${this.apiUrl}/${id}`); }
  create(supplier: Partial<Supplier>): Observable<Supplier> { return this.http.post<Supplier>(this.apiUrl, supplier); }
  update(id: string, supplier: Partial<Supplier>): Observable<Supplier> { return this.http.put<Supplier>(`${this.apiUrl}/${id}`, supplier); }
  delete(id: string): Observable<void> { return this.http.delete<void>(`${this.apiUrl}/${id}`); }
}
