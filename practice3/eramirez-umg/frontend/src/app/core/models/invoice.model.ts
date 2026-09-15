export interface Invoice {
  id: string;
  supplierId: string;
  supplierName: string;
  number: string;
  issueDate: string;
  dueDate?: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  notes?: string;
  createdAt: string;
  details: InvoiceDetail[];
}

export interface InvoiceDetail {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface InvoiceItemRequest { productId: string; quantity: number; }

export interface CreateInvoiceRequest {
  supplierId: string;
  number: string;
  issueDate: string;
  dueDate?: string | null;
  tax: number;
  status: string;
  notes?: string;
  items: InvoiceItemRequest[];
}

export interface InvoicePagedResult {
  items: Invoice[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
