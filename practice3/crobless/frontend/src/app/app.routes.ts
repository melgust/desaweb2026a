import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Redirección por defecto
  { path: '', redirectTo: '/products', pathMatch: 'full' },

  // Autenticación
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },

  // --- PRODUCTOS ---
  {
    path: 'products',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/products/pages/product-list/product-list.component').then(
        (m) => m.ProductListComponent
      ),
  },
  {
    path: 'products/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/products/pages/product-form/product-form.component').then(
        (m) => m.ProductFormComponent
      ),
  },
  {
    path: 'products/edit/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/products/pages/product-form/product-form.component').then(
        (m) => m.ProductFormComponent
      ),
  },

  // --- PROVEEDORES ---
  {
    path: 'suppliers',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/suppliers/pages/supplier-list/supplier-list.component').then(
        (m) => m.SupplierListComponent
      ),
  },
  {
    path: 'suppliers/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/suppliers/pages/supplier-form/supplier-form.component').then(
        (m) => m.SupplierFormComponent
      ),
  },
  {
    path: 'suppliers/edit/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/suppliers/pages/supplier-form/supplier-form.component').then(
        (m) => m.SupplierFormComponent
      ),
  },

  // --- CATEGORÍAS ---
  {
    path: 'categories',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/categories/pages/category-list/category-list.component').then(
        (m) => m.CategoryListComponent
      ),
  },
  {
    path: 'categories/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/categories/pages/category-form/category-form.component').then(
        (m) => m.CategoryFormComponent
      ),
  },
  {
    path: 'categories/edit/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/categories/pages/category-form/category-form.component').then(
        (m) => m.CategoryFormComponent
      ),
  },

  { path: 'invoices', canActivate: [authGuard], loadComponent: () => import('./features/invoices/pages/invoice-list/invoice-list.component').then(m => m.InvoiceListComponent) },
  { path: 'invoices/new', canActivate: [authGuard], loadComponent: () => import('./features/invoices/pages/invoice-form/invoice-form.component').then(m => m.InvoiceFormComponent) },
  { path: 'invoices/edit/:id', canActivate: [authGuard], loadComponent: () => import('./features/invoices/pages/invoice-form/invoice-form.component').then(m => m.InvoiceFormComponent) },
  { path: 'invoices/view/:id', canActivate: [authGuard], data: { readonly: true }, loadComponent: () => import('./features/invoices/pages/invoice-form/invoice-form.component').then(m => m.InvoiceFormComponent) },

  // Fallback: ruta no encontrada
  { path: '**', redirectTo: '/products' },
];