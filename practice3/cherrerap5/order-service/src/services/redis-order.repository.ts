import { randomUUID } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { createClient } from 'redis';
import type { Order, OrderRepository } from '../models/order.js';
import { HttpError } from '../middleware/error.middleware.js';
export class RedisOrderRepository implements OrderRepository {
  private lease = new AsyncLocalStorage<{ key: string; token: string }>();
  constructor(private redis: ReturnType<typeof createClient>, private ttl = 86400) {}
  private key(userId: string) { return `order:draft:user:${userId}`; }
  private async execute<T>(action: () => Promise<T>): Promise<T> {
    if (!this.redis.isReady) throw new HttpError(503, 'Redis no disponible');
    try { return await action(); } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(503, 'Redis no disponible');
    }
  }
  async get(userId: string): Promise<Order | null> {
    const value = await this.execute(() => this.redis.get(this.key(userId)));
    return value ? JSON.parse(value) as Order : null;
  }
  async save(order: Order, renew = true) {
    await this.execute(async () => {
      const lease = this.lease.getStore();
      if (!lease) throw new HttpError(409, 'Se requiere bloqueo del pedido');
      const saved = await this.redis.eval(`
        if redis.call('GET',KEYS[2]) ~= ARGV[1] then return -1 end
        if ARGV[4] == 'renew' then redis.call('SET',KEYS[1],ARGV[2],'EX',ARGV[3]); return 1 end
        if redis.call('EXISTS',KEYS[1]) == 0 then return 0 end
        redis.call('SET',KEYS[1],ARGV[2],'XX','KEEPTTL'); return 1
      `, { keys: [this.key(order.userId), lease.key], arguments: [lease.token, JSON.stringify(order), String(this.ttl), renew ? 'renew' : 'keep'] });
      if (saved === -1) throw new HttpError(409, 'Bloqueo vencido; reintenta');
      if (saved === 0) throw new HttpError(404, 'Pedido expirado');
    });
  }
  async delete(userId: string) {
    const lease = this.lease.getStore();
    if (!lease) throw new HttpError(409, 'Se requiere bloqueo del pedido');
    const result = await this.execute(() => this.redis.eval("if redis.call('GET',KEYS[2]) ~= ARGV[1] then return -1 end return redis.call('DEL',KEYS[1])", { keys: [this.key(userId), lease.key], arguments: [lease.token] }));
    if (result === -1) throw new HttpError(409, 'Bloqueo vencido; reintenta');
  }
  async exclusive<T>(userId: string, action: () => Promise<T>): Promise<T> {
    const key = `order:lock:user:${userId}`, token = randomUUID();
    const acquired = await this.execute(() => this.redis.set(key, token, { NX: true, EX: 120 }));
    if (!acquired) throw new HttpError(409, 'Pedido ocupado; reintenta');
    try { return await this.lease.run({ key, token }, action); }
    finally {
      await this.execute(() => this.redis.eval("if redis.call('GET',KEYS[1]) == ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end", { keys: [key], arguments: [token] }));
    }
  }
}
