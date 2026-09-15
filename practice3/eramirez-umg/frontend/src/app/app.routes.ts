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
    path: 'suppliers',
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./features/suppliers/pages/supplier-list/supplier-list.component').then((m) => m.SupplierListComponent) },
      { path: 'new', canActivate: [roleGuard(['Admin', 'Manager'])], loadComponent: () => import('./features/suppliers/pages/supplier-form/supplier-form.component').then((m) => m.SupplierFormComponent) },
      { path: 'edit/:id', canActivate: [roleGuard(['Admin', 'Manager'])], loadComponent: () => import('./features/suppliers/pages/supplier-form/supplier-form.component').then((m) => m.SupplierFormComponent) },
    ],
  },
  {
    path: 'cart',
    canActivate: [authGuard, roleGuard(['Admin', 'Manager'])],
    loadComponent: () => import('./features/cart/pages/cart.component').then(m => m.CartComponent)
  },
  {
    path: 'invoices',
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./features/invoices/pages/invoice-list/invoice-list.component').then((m) => m.InvoiceListComponent) },
      { path: 'new', canActivate: [roleGuard(['Admin', 'Manager'])], loadComponent: () => import('./features/invoices/pages/invoice-form/invoice-form.component').then((m) => m.InvoiceFormComponent) },
      { path: 'edit/:id', canActivate: [roleGuard(['Admin', 'Manager'])], loadComponent: () => import('./features/invoices/pages/invoice-form/invoice-form.component').then((m) => m.InvoiceFormComponent) },
      { path: ':id', loadComponent: () => import('./features/invoices/pages/invoice-detail/invoice-detail.component').then(m => m.InvoiceDetailComponent) },
    ],
  },
  { path: '**', redirectTo: 'products' },
];
