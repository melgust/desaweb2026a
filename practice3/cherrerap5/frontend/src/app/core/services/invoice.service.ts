import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Invoice, InvoicePayload } from '../models/invoice.model';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly url = `${environment.apiUrl}/invoices`;
  constructor(private http: HttpClient) {}
  getAll(): Observable<Invoice[]> { return this.http.get<Invoice[]>(this.url); }
  getById(id: string): Observable<Invoice> { return this.http.get<Invoice>(`${this.url}/${id}`); }
  create(data: InvoicePayload): Observable<Invoice> { return this.http.post<Invoice>(this.url, data); }
  update(id: string, data: InvoicePayload): Observable<Invoice> { return this.http.put<Invoice>(`${this.url}/${id}`, data); }
  delete(id: string): Observable<void> { return this.http.delete<void>(`${this.url}/${id}`); }
}
