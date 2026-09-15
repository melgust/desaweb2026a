import Decimal from 'decimal.js';
import { randomUUID } from 'node:crypto';
import { HttpError } from '../middleware/errors.js';

export function productId(value) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 128) {
    throw new HttpError(400, 'A valid productId is required.');
  }
  return value.trim();
}

export function quantity(value) {
  if (!Number.isInteger(value) || value <= 0 || value > 2147483647) {
    throw new HttpError(400, 'Quantity must be a positive integer within the supported range.');
  }
  return value;
}

export function money(value) {
  const amount = new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  if (!amount.isFinite() || amount.isNegative() || amount.gt('90071992547409.91')) {
    throw new HttpError(400, 'Amount exceeds the supported monetary range.');
  }
  return amount.toNumber();
}

export function emptyCart(cartId) {
  return { cartId, items: [], subtotal: 0, totalQuantity: 0, updatedAt: null, version: null };
}

export function recalculate(cart) {
  let subtotal = new Decimal(0);
  let totalQuantity = 0;
  for (const item of cart.items) {
    item.subtotal = money(new Decimal(item.unitPrice).times(item.quantity));
    subtotal = subtotal.plus(item.subtotal);
    totalQuantity += item.quantity;
  }
  if (!Number.isSafeInteger(totalQuantity)) throw new HttpError(400, 'Total quantity is too large.');
  return { ...cart, subtotal: money(subtotal), totalQuantity, updatedAt: new Date().toISOString(), version: randomUUID() };
}
