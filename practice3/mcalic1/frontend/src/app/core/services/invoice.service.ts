import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Invoice,
  InvoicePagedResult,
  CreateInvoiceRequest
} from '../models/invoice.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly apiUrl = `${environment.apiUrl}/invoices`;

  constructor(private http: HttpClient) {}

  getInvoices(
    page: number = 1,
    pageSize: number = 10
  ): Observable<InvoicePagedResult> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<InvoicePagedResult>(
      this.apiUrl,
      { params }
    );
  }

  getInvoiceById(id: string): Observable<Invoice> {
    return this.http.get<Invoice>(
      `${this.apiUrl}/${id}`
    );
  }

  createInvoice(
    request: CreateInvoiceRequest
  ): Observable<Invoice> {
    return this.http.post<Invoice>(
      this.apiUrl,
      request
    );
  }
}