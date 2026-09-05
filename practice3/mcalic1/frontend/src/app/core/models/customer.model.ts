export interface Customer {
  id: string;
  name: string;
  nit?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerPagedResult {
  items: Customer[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}