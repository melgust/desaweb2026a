export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId?: string;
  categoryName?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ProductPagedResult {
  items: Product[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
