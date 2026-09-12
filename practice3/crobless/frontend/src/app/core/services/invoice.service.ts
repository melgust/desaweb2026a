import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Invoice, InvoiceRequest } from '../models/invoice.model';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly apiUrl = `${environment.apiUrl}/invoices`;
  constructor(private http: HttpClient) {}
  getAll() { return this.http.get<Invoice[]>(this.apiUrl); }
  getById(id: string) { return this.http.get<Invoice>(`${this.apiUrl}/${id}`); }
  getSettings() { return this.http.get<{ taxRate: number }>(`${this.apiUrl}/settings`); }
  create(request: InvoiceRequest) { return this.http.post<Invoice>(this.apiUrl, request); }
  update(id: string, request: InvoiceRequest) { return this.http.put<Invoice>(`${this.apiUrl}/${id}`, request); }
  delete(id: string) { return this.http.delete<void>(`${this.apiUrl}/${id}`); }
}
