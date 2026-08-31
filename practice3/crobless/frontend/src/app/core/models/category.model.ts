export interface Category {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface CategoryPagedResult {
  items: Category[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}