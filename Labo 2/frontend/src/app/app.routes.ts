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
    path: 'categories',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import(
            './features/categories/pages/category-list/category-list.component'
          ).then((m) => m.CategoryListComponent),
      },
      {
        path: 'new',
        canActivate: [roleGuard(['Admin', 'Manager'])],
        loadComponent: () =>
          import(
            './features/categories/pages/category-form/category-form.component'
          ).then((m) => m.CategoryFormComponent),
      },
      {
        path: 'edit/:id',
        canActivate: [roleGuard(['Admin', 'Manager'])],
        loadComponent: () =>
          import(
            './features/categories/pages/category-form/category-form.component'
          ).then((m) => m.CategoryFormComponent),
      },
    ],
  },
  {
    path: 'catalog',
    canActivate: [authGuard],
    children: [
      {
        path: 'products',
        children: [
          {
            path: '',
            loadComponent: () =>
              import(
                './features/catalog/pages/catalog-product-list/catalog-product-list.component'
              ).then((m) => m.CatalogProductListComponent),
          },
          {
            path: 'new',
            canActivate: [roleGuard(['Admin', 'Manager'])],
            loadComponent: () =>
              import(
                './features/catalog/pages/catalog-product-form/catalog-product-form.component'
              ).then((m) => m.CatalogProductFormComponent),
          },
          {
            path: 'edit/:id',
            canActivate: [roleGuard(['Admin', 'Manager'])],
            loadComponent: () =>
              import(
                './features/catalog/pages/catalog-product-form/catalog-product-form.component'
              ).then((m) => m.CatalogProductFormComponent),
          },
        ],
      },
      {
        path: 'categories',
        children: [
          {
            path: '',
            loadComponent: () =>
              import(
                './features/catalog/pages/catalog-category-list/catalog-category-list.component'
              ).then((m) => m.CatalogCategoryListComponent),
          },
          {
            path: 'new',
            canActivate: [roleGuard(['Admin', 'Manager'])],
            loadComponent: () =>
              import(
                './features/catalog/pages/catalog-category-form/catalog-category-form.component'
              ).then((m) => m.CatalogCategoryFormComponent),
          },
          {
            path: 'edit/:id',
            canActivate: [roleGuard(['Admin', 'Manager'])],
            loadComponent: () =>
              import(
                './features/catalog/pages/catalog-category-form/catalog-category-form.component'
              ).then((m) => m.CatalogCategoryFormComponent),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: 'products' },
];