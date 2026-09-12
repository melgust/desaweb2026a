import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CatalogCategory } from '../models/catalog.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CatalogCategoryService {
  private readonly apiUrl = `${environment.catalogApiUrl}/categories`;

  constructor(private http: HttpClient) {}

  getCategories(): Observable<CatalogCategory[]> {
    return this.http.get<CatalogCategory[]>(this.apiUrl);
  }

  getCategoryById(id: string): Observable<CatalogCategory> {
    return this.http.get<CatalogCategory>(`${this.apiUrl}/${id}`);
  }

  createCategory(category: { name: string; description?: string }): Observable<CatalogCategory> {
    return this.http.post<CatalogCategory>(this.apiUrl, category);
  }

  updateCategory(id: string, category: { name: string; description?: string }): Observable<CatalogCategory> {
    return this.http.put<CatalogCategory>(`${this.apiUrl}/${id}`, category);
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
