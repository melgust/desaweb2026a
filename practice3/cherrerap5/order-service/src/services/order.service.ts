import { randomUUID } from 'node:crypto';
import type { Order, OrderRepository } from '../models/order.js';
import type { CatalogClient } from './catalog.client.js';
import type { InvoiceClient } from './invoice.client.js';
import { HttpError } from '../middleware/error.middleware.js';
export class OrderService {
  constructor(private repository: OrderRepository, private catalog: Pick<CatalogClient, 'item'>, private invoices: Pick<InvoiceClient, 'confirm'>, private ttlSeconds = 86400) {}
  async current(userId: string) {
    const order = await this.repository.get(userId);
    if (!order) throw new HttpError(404, 'No hay pedido temporal activo');
    return order;
  }
  private editable(order: Order) {
    if (order.status !== 'DRAFT') throw new HttpError(409, 'Confirmación pendiente; reintenta confirmar antes de modificar');
  }
  private async save(order: Order) {
    const now = Date.now();
    order.updatedAt = new Date(now).toISOString();
    order.expiresAt = new Date(now + this.ttlSeconds * 1000).toISOString();
    order.items.forEach(i => i.subtotal = Math.round(i.unitPrice * 100) * i.quantity / 100);
    const cents = order.items.reduce((sum, i) => sum + Math.round(i.subtotal * 100), 0);
    if (!Number.isSafeInteger(cents)) throw new HttpError(400, 'El total excede el límite monetario');
    order.total = order.subtotal = cents / 100;
    await this.repository.save(order);
    return order;
  }
  add(userId: string, input: { productId: string; supplierId: string; quantity: number }) {
    return this.repository.exclusive(userId, async () => {
      const now = new Date().toISOString();
      const order = await this.repository.get(userId) ?? { id: randomUUID(), userId, status: 'DRAFT', createdAt: now, updatedAt: now, expiresAt: now, items: [], subtotal: 0, total: 0 };
      this.editable(order);
      const existing = order.items.find(i => i.productId === input.productId);
      if (existing && existing.supplierId !== input.supplierId) throw new HttpError(409, 'El producto ya tiene otro proveedor; elimina la línea primero');
      const count = (existing?.quantity ?? 0) + input.quantity;
      if (count > 100000 || (!existing && order.items.length >= 100)) throw new HttpError(400, 'Límite del pedido excedido');
      const item = { ...await this.catalog.item(input.productId, input.supplierId), quantity: count, subtotal: 0 };
      if (existing) Object.assign(existing, item); else order.items.push(item);
      return this.save(order);
    });
  }
  update(userId: string, productId: string, quantity?: number) {
    return this.repository.exclusive(userId, async () => {
      const order = await this.current(userId); this.editable(order);
      const item = order.items.find(i => i.productId === productId);
      if (!item) throw new HttpError(404, 'Producto fuera del pedido');
      if (quantity === undefined) order.items = order.items.filter(i => i !== item);
      else { Object.assign(item, await this.catalog.item(productId, item.supplierId)); item.quantity = quantity; }
      return this.save(order);
    });
  }
  clear(userId: string) {
    return this.repository.exclusive(userId, async () => {
      const order = await this.repository.get(userId); if (order) this.editable(order);
      await this.repository.delete(userId);
    });
  }
  confirm(userId: string, token: string) {
    return this.repository.exclusive(userId, async () => {
      const order = await this.current(userId);
      if (!order.items.length) throw new HttpError(400, 'Pedido vacío');
      if (order.status === 'DRAFT') {
        await Promise.all(order.items.map(i => this.catalog.item(i.productId, i.supplierId)));
        // Freeze the payload before HTTP: an ambiguous timeout must be retried with the same order.
        order.status = 'CONFIRMING'; await this.repository.save(order, false);
      }
      let invoice;
      try { invoice = await this.invoices.confirm(order, token); }
      catch (error) {
        if (error instanceof HttpError && [400, 401, 403, 404, 422].includes(error.status)) {
          order.status = 'DRAFT'; await this.repository.save(order, false);
        }
        throw error;
      }
      await this.repository.delete(userId);
      return { orderId: order.id, invoice };
    });
  }
}
