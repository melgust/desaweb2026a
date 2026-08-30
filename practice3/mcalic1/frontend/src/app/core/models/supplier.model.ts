export interface Supplier {
  id: string;
  name: string;
  contactEmail?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface SupplierPagedResult {
  items: Supplier[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
