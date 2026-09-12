export interface CatalogCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  isActive: boolean;
  categoryId?: string | null;
  categoryName?: string | null;
  createdAt: string;
}

export interface CatalogProductPagedResult {
  items: CatalogProduct[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
