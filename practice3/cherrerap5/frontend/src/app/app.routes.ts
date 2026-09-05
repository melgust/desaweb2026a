import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'products',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import(
            './features/products/pages/product-list/product-list.component'
          ).then((m) => m.ProductListComponent),
      },
      {
        path: 'new',
        canActivate: [roleGuard(['Admin', 'Manager'])],
        loadComponent: () =>
          import(
            './features/products/pages/product-form/product-form.component'
          ).then((m) => m.ProductFormComponent),
      },
      {
        path: 'edit/:id',
        canActivate: [roleGuard(['Admin', 'Manager'])],
        loadComponent: () =>
          import(
            './features/products/pages/product-form/product-form.component'
          ).then((m) => m.ProductFormComponent),
      },
    ],
  },
  {
    path: 'suppliers', canActivate: [authGuard], children: [
      { path: '', loadComponent: () => import('./features/suppliers/supplier-list.component').then(m => m.SupplierListComponent) },
      { path: 'new', canActivate: [roleGuard(['Admin', 'Manager'])], loadComponent: () => import('./features/suppliers/supplier-form.component').then(m => m.SupplierFormComponent) },
      { path: 'edit/:id', canActivate: [roleGuard(['Admin', 'Manager'])], loadComponent: () => import('./features/suppliers/supplier-form.component').then(m => m.SupplierFormComponent) }
    ]
  },
  {
    path: 'invoices', canActivate: [authGuard], children: [
      { path: '', loadComponent: () => import('./features/invoices/invoice-list.component').then(m => m.InvoiceListComponent) },
      { path: 'new', canActivate: [roleGuard(['Admin', 'Manager'])], loadComponent: () => import('./features/invoices/invoice-form.component').then(m => m.InvoiceFormComponent) },
      { path: 'edit/:id', canActivate: [roleGuard(['Admin', 'Manager'])], loadComponent: () => import('./features/invoices/invoice-form.component').then(m => m.InvoiceFormComponent) }
    ]
  },
  { path: '**', redirectTo: 'products' },
];
