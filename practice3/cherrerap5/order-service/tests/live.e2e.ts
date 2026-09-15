import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from 'redis';

test('login -> two products -> TTL renewal -> one invoice -> Redis DEL -> idempotent retry', { timeout: 60000 }, async () => {
  const backend = process.env.E2E_BACKEND_URL ?? 'http://localhost:5000';
  const orders = process.env.E2E_ORDER_URL ?? 'http://localhost:3000';
  const catalog = process.env.E2E_CATALOG_URL ?? 'http://localhost:8080';
  const login = await fetch(`${backend}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: process.env.E2E_EMAIL ?? 'admin@enterprise.com', password: process.env.E2E_PASSWORD ?? 'Admin123!' }) });
  assert.equal(login.status, 200);
  const { token } = await login.json() as { token: string };
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()) as Record<string, string>;
  const userId = claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ?? claims.nameid ?? claims.sub;
  const key = `order:draft:user:${userId}`;
  // Never clear or modify a pre-existing user cart.
  assert.equal((await fetch(`${orders}/api/orders/current`, { headers })).status, 404, 'Use an account without an existing draft');
  const redis = createClient({ url: process.env.REDIS_TEST_URL ?? 'redis://localhost:6379', disableOfflineQueue: true });
  await redis.connect();
  let invoiceId: string | undefined;
  let draftId: string | undefined;
  try {
    const products = await (await fetch(`${catalog}/api/products?page=1&pageSize=100`)).json() as { items: { id: string; isActive: boolean; price: number }[] };
    const suppliers = await (await fetch(`${catalog}/api/suppliers`)).json() as { id: string; isActive: boolean }[];
    const [a, b] = products.items.filter(p => p.isActive); const supplier = suppliers.find(s => s.isActive)!;
    assert.ok(a && b && supplier);
    const add = async (productId: string, quantity: number) => {
      const response = await fetch(`${orders}/api/orders/items`, { method: 'POST', headers, body: JSON.stringify({ productId, supplierId: supplier.id, quantity }) });
      assert.equal(response.status, 200, await response.clone().text()); return response.json();
    };
    draftId = (await add(a.id, 2)).id;
    const draft = await add(b.id, 1);
    assert.equal(draft.items.length, 2); assert.equal(draft.id, draftId);
    assert.equal(draft.total, (Math.round(a.price * 100) * 2 + Math.round(b.price * 100)) / 100);
    assert.ok(await redis.ttl(key) >= 86395);
    await redis.expire(key, 60);
    const update = await fetch(`${orders}/api/orders/items/${a.id}`, { method: 'PUT', headers, body: JSON.stringify({ quantity: 3 }) });
    assert.equal(update.status, 200); assert.ok(await redis.ttl(key) >= 86395);
    const before = await (await fetch(`${backend}/api/invoices`, { headers })).json() as unknown[];
    const confirm = await fetch(`${orders}/api/orders/confirm`, { method: 'POST', headers, body: '{}' });
    assert.equal(confirm.status, 200, await confirm.clone().text());
    const result = await confirm.json(); invoiceId = result.invoice.id;
    assert.equal(result.invoice.items.length, 2);
    assert.equal(result.invoice.total, (Math.round(a.price * 100) * 3 + Math.round(b.price * 100)) / 100);
    assert.equal(await redis.exists(key), 0);
    assert.equal((await fetch(`${orders}/api/orders/current`, { headers })).status, 404);
    const after = await (await fetch(`${backend}/api/invoices`, { headers })).json() as unknown[];
    assert.equal(after.length, before.length + 1);
    const retry = await fetch(`${backend}/api/invoices/from-order`, { method: 'POST', headers, body: JSON.stringify({ orderId: draftId, items: [{ productId: a.id, supplierId: supplier.id, quantity: 3 }, { productId: b.id, supplierId: supplier.id, quantity: 1 }] }) });
    assert.equal(retry.status, 200); assert.equal((await retry.json()).id, invoiceId);
    const persisted = await fetch(`${backend}/api/invoices/${invoiceId}`, { headers });
    assert.equal(persisted.status, 200); assert.equal((await persisted.json()).items.length, 2);
    draftId = (await add(a.id, 1)).id;
    assert.ok(await redis.ttl(key) >= 86395);
    console.info('Verified: 2 products, 1 invoice, native TTL 86400, renewal, immediate DEL and idempotent retry.');
  } finally {
    const value = await redis.get(key);
    if (value && JSON.parse(value).id === draftId) await fetch(`${orders}/api/orders/current`, { method: 'DELETE', headers });
    if (invoiceId) await fetch(`${backend}/api/invoices/${invoiceId}`, { method: 'DELETE', headers });
    await redis.quit();
  }
});
