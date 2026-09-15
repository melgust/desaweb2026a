import { config } from '../config/index.js';
import { HttpError } from '../middleware/errors.js';
import { emptyCart, quantity, recalculate } from '../models/cart.js';
import { getProduct } from './catalog.js';

// Compare-and-set keeps concurrent requests from overwriting one another.
// The value and its TTL change atomically; no per-process locks are needed.
const saveScript = `
local current = redis.call('GET', KEYS[1]) or ''
if current ~= ARGV[1] then return 0 end
redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
return 1
`;

const clearScript = `
local current = redis.call('GET', KEYS[1])
if not current then return 1 end
local cart = cjson.decode(current)
if (cart.version or cart.updatedAt or '') ~= ARGV[1] then return 0 end
redis.call('DEL', KEYS[1])
return 1
`;

export class CartService {
  constructor(redis) { this.redis = redis; }

  async command(action) {
    if (!this.redis.isReady) throw new HttpError(503, 'Cart storage is temporarily unavailable.');
    try { return await action(); }
    catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(503, 'Cart storage is temporarily unavailable.');
    }
  }

  async get(cartId) {
    const raw = await this.command(() => this.redis.get(`cart:${cartId}`));
    if (!raw) return emptyCart(cartId);
    const cart = JSON.parse(raw);
    // Carts written before versioning can still be checked out safely.
    return { ...cart, version: cart.version || cart.updatedAt };
  }

  async mutate(cartId, change) {
    const key = `cart:${cartId}`;
    for (let attempt = 0; attempt < 10; attempt++) {
      const raw = await this.command(() => this.redis.get(key));
      const cart = raw ? JSON.parse(raw) : emptyCart(cartId);
      change(cart);
      const updated = recalculate(cart);
      const saved = await this.command(() => this.redis.eval(saveScript, {
        keys: [key], arguments: [raw || '', JSON.stringify(updated), String(config.ttl)]
      }));
      if (saved === 1) return updated;
    }
    throw new HttpError(409, 'Cart changed concurrently. Please retry the operation.');
  }

  async add(cartId, id, amount) {
    const product = await getProduct(id);
    return this.mutate(cartId, cart => {
      const item = cart.items.find(item => item.productId === id);
      const count = quantity((item?.quantity || 0) + amount);
      if (count > product.stock) throw new HttpError(409, `Insufficient stock for '${product.name}'.`);
      if (item) Object.assign(item, { quantity: count, name: product.name, unitPrice: product.price });
      else cart.items.push({ productId: id, name: product.name, quantity: count, unitPrice: product.price, subtotal: 0 });
    });
  }

  async update(cartId, id, amount) {
    const product = await getProduct(id);
    return this.mutate(cartId, cart => {
      const item = cart.items.find(item => item.productId === id);
      if (!item) throw new HttpError(404, 'Product is not in the cart.');
      if (amount > product.stock) throw new HttpError(409, `Insufficient stock for '${product.name}'.`);
      Object.assign(item, { quantity: amount, name: product.name, unitPrice: product.price });
    });
  }

  async remove(cartId, id) {
    return this.mutate(cartId, cart => {
      if (!cart.items.some(item => item.productId === id)) throw new HttpError(404, 'Product is not in the cart.');
      cart.items = cart.items.filter(item => item.productId !== id);
    });
  }

  async clear(cartId, version) {
    if (version === undefined) {
      await this.command(() => this.redis.del(`cart:${cartId}`));
      return;
    }
    const cleared = await this.command(() => this.redis.eval(clearScript, {
      keys: [`cart:${cartId}`], arguments: [version]
    }));
    if (cleared !== 1) throw new HttpError(409, 'The cart has changed. Its current items have been kept.');
  }
}
