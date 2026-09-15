import { z } from 'zod';
import type { Order } from '../models/order.js';
import { requestJson } from './http.client.js';
import { HttpError } from '../middleware/error.middleware.js';

const invoiceResponse = z.object({
  id: z.string().uuid(), number: z.string(), total: z.number().nonnegative(),
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() }).passthrough()).min(1)
}).passthrough();

export class InvoiceClient {
  constructor(private baseUrl: string) {}
  async confirm(order: Order, token: string) {
    const response = await requestJson(`${this.baseUrl}/api/invoices/from-order`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderId: order.id, items: order.items.map(i => ({
        supplierId: i.supplierId, productId: i.productId, quantity: i.quantity
      })) })
    });
    const result = invoiceResponse.safeParse(response);
    if (!result.success) throw new HttpError(502, 'Respuesta de factura inválida');
    return result.data;
  }
}
