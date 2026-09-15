export interface OrderItem {
  productId: string; productName: string; supplierId: string; supplierName: string;
  quantity: number; unitPrice: number; subtotal: number;
}
export interface Order {
  id: string; userId: string; status: 'DRAFT' | 'CONFIRMING'; createdAt: string;
  updatedAt: string; expiresAt: string; items: OrderItem[]; subtotal: number; total: number;
}
export interface OrderRepository {
  get(userId: string): Promise<Order | null>;
  save(order: Order, renew?: boolean): Promise<void>;
  delete(userId: string): Promise<void>;
  exclusive<T>(userId: string, action: () => Promise<T>): Promise<T>;
}
