export interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Cart {
  cartId: string;
  items: CartItem[];
  subtotal: number;
  totalQuantity: number;
  updatedAt: string | null;
  version: string | null;
}
