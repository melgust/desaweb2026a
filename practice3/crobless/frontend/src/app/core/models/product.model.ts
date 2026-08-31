export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  isActive: boolean;
  createdAt: string;
  supplierId?: string | null;
  supplierName?: string | null;
}

export interface ProductPagedResult {
  items: Product[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean; // SE AGREGA
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  isActive: boolean;
  createdAt: string;
  supplierId?: string | null;
  supplierName?: string | null;
  categoryId?: string | null;    // <-- AGREGADO
  categoryName?: string | null;  // <-- AGREGADO
}
