export interface InvoiceItemPayload {
  productId: string; supplierId: string; quantity: number; unitPrice: number;
}
export interface InvoiceItem extends InvoiceItemPayload {
  id: string; productName: string; supplierName: string; subtotal: number;
}
export interface Invoice {
  id: string; number: string; invoiceDate: string; dueDate?: string | null;
  items: InvoiceItem[]; subtotal: number; total: number;
  status: 'Pending' | 'Paid' | 'Cancelled'; notes?: string | null; createdAt: string;
}
export interface InvoicePayload {
  number: string; invoiceDate: string; dueDate: string | null; items: InvoiceItemPayload[];
  status: 'Pending' | 'Paid' | 'Cancelled'; notes: string;
}
