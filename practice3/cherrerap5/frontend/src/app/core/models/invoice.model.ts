export interface Invoice {
  id: string; number: string; supplierId: string; supplierName: string;
  productId: string; productName: string; invoiceDate: string; dueDate?: string;
  quantity: number; unitPrice: number; total: number; status: 'Pending' | 'Paid' | 'Cancelled';
  notes?: string; createdAt: string;
}

export interface InvoicePayload {
  number: string; supplierId: string; productId: string; invoiceDate: string;
  dueDate: string | null; quantity: number; unitPrice: number;
  status: 'Pending' | 'Paid' | 'Cancelled'; notes: string;
}
