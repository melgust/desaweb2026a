import { Invoice } from './invoice.model';
export interface OrderItem {
  productId: string; productName: string; supplierId: string; supplierName: string;
  quantity: number; unitPrice: number; subtotal: number;
}
export interface Order {
  id: string; status: 'DRAFT' | 'CONFIRMING'; expiresAt: string; updatedAt: string;
  items: OrderItem[]; subtotal: number; total: number;
}
export interface ConfirmOrderResult { orderId: string; invoice: Invoice; }
