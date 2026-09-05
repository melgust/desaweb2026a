export interface Supplier {
  id: string; name: string; taxId?: string; contactName?: string; email?: string;
  phone?: string; address?: string; isActive: boolean; createdAt: string;
}

export type SupplierPayload = Omit<Supplier, 'id' | 'createdAt'>;
