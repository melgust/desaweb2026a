export interface InvoiceDetailRequest {
  productId: string;
  quantity: number;
  unitPrice: number;
}
export interface InvoiceRequest {
  invoiceNumber: string;
  invoiceDate: string;
  supplierId: string;
  notes: string | null;
  items: InvoiceDetailRequest[];
}
export interface InvoiceDetail extends InvoiceDetailRequest {
  id: string;
  productName: string;
  subtotal: number;
}
export interface Invoice extends InvoiceRequest {
  id: string;
  supplierName: string;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  items: InvoiceDetail[];
}
