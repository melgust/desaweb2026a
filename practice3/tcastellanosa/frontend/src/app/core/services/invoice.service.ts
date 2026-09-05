import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Invoice, InvoiceDetail } from '../models/invoice.model';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly apiUrl = `${environment.apiUrl}/invoices`;
  constructor(private http: HttpClient) {}
  getAll(): Observable<Invoice[]> { return this.http.get<Invoice[]>(this.apiUrl); }
  getById(id: string): Observable<Invoice> { return this.http.get<Invoice>(`${this.apiUrl}/${id}`); }
  create(invoice: { invoiceNumber: string; supplierId: string; invoiceDate: string; details: InvoiceDetail[] }): Observable<Invoice> { return this.http.post<Invoice>(this.apiUrl, invoice); }
}
