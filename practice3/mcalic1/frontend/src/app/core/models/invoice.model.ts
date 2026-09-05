export interface InvoiceDetail {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  total: number;
  createdAt: string;
  details: InvoiceDetail[];
}

export interface CreateInvoiceDetail {
  productId: string;
  quantity: number;
}

export interface CreateInvoiceRequest {
  invoiceNumber: string;
  customerId: string;
  date?: string;
  details: CreateInvoiceDetail[];
}

export interface InvoicePagedResult {
  items: Invoice[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}