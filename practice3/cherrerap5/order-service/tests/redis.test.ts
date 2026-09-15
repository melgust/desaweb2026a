import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from 'redis';
import { RedisOrderRepository } from '../src/services/redis-order.repository.js';
import type { Order } from '../src/models/order.js';

test('Redis real: TTL, renewal, KEEPTTL, lock contention, expiration and deletion', { skip: !process.env.REDIS_TEST_URL }, async () => {
  const redis = createClient({ url: process.env.REDIS_TEST_URL, disableOfflineQueue: true });
  redis.on('error', () => {});
  await redis.connect();
  const userId = `test-${randomUUID()}`, key = `order:draft:user:${userId}`;
  const repository = new RedisOrderRepository(redis);
  const now = new Date().toISOString();
  const order: Order = { id: randomUUID(), userId, status: 'DRAFT', createdAt: now, updatedAt: now, expiresAt: now, items: [], subtotal: 0, total: 0 };
  try {
    await repository.exclusive(userId, () => repository.save(order));
    assert.ok(await redis.ttl(key) >= 86399);
    await redis.expire(key, 60);
    await repository.exclusive(userId, () => repository.save(order, false));
    assert.ok(await redis.ttl(key) <= 60);
    await repository.exclusive(userId, async () => {
      await assert.rejects(repository.exclusive(userId, async () => {}), { status: 409 });
      await repository.save(order);
    });
    assert.ok(await redis.ttl(key) >= 86399);
    await redis.pExpire(key, 1);
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(await repository.get(userId), null);
    await repository.exclusive(userId, () => repository.save(order));
    await repository.exclusive(userId, () => repository.delete(userId));
    assert.equal(await redis.exists(key), 0);
    const shortLived = new RedisOrderRepository(redis, 1);
    await shortLived.exclusive(userId, () => shortLived.save(order));
    assert.ok(await redis.ttl(key) <= 1);
    await new Promise(resolve => setTimeout(resolve, 1100));
    assert.equal(await shortLived.get(userId), null, 'Redis expires the key natively without cleanup jobs');
    await repository.exclusive(userId, async () => {
      await redis.del(`order:lock:user:${userId}`);
      await assert.rejects(repository.save(order), { status: 409 });
    });
  } finally { await redis.del(key); await redis.quit(); }
});

test('Redis disconnected returns 503 without pretending to save', async () => {
  const redis = createClient({ disableOfflineQueue: true });
  const repository = new RedisOrderRepository(redis);
  await assert.rejects(repository.get('user'), { status: 503 });
  await assert.rejects(repository.exclusive('user', async () => {}), { status: 503 });
});
