export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  isActive: boolean;
  createdAt: string;
  categoryId?: string;
  categoryName?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface ProductPagedResult {
  items: Product[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}