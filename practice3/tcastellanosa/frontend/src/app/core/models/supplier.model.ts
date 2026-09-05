export interface Supplier {
  id: string;
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}
