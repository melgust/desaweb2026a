import { test } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.js';
import { OrderService } from '../src/services/order.service.js';
import { HttpError } from '../src/middleware/error.middleware.js';
import type { Order, OrderRepository } from '../src/models/order.js';
import { loadEnv } from '../src/config/env.js';
import { addItem, updateItem, identifier } from '../src/validators/order.js';

class MemoryRepository implements OrderRepository {
  data = new Map<string, Order>();
  async get(id: string) {
    const order = this.data.get(id);
    return order && Date.parse(order.expiresAt) > Date.now() ? structuredClone(order) : null;
  }
  async save(order: Order) { this.data.set(order.userId, structuredClone(order)); }
  async delete(id: string) { this.data.delete(id); }
  async exclusive<T>(_id: string, action: () => Promise<T>) { return action(); }
}
const input = { productId: 'a'.repeat(24), supplierId: 'b'.repeat(24), quantity: 2 };
function setup() {
  const repository = new MemoryRepository();
  const catalog = { async item(productId: string, supplierId: string) { return { productId, supplierId, productName: 'Product', supplierName: 'Supplier', unitPrice: 12.35 }; } };
  const invoices = { async confirm() { return { id: '5eb302f6-289a-41fd-845f-7aa6625e7fca', number: 'INV', total: 24.7, items: [{ productId: input.productId, quantity: 2 }] }; } };
  return { repository, catalog, invoices, service: new OrderService(repository, catalog, invoices) };
}
test('create, read, totals, increment and user isolation', async () => {
  const { service } = setup();
  const first = await service.add('A', input);
  assert.equal(first.total, 24.7);
  assert.equal(Date.parse(first.expiresAt) - Date.parse(first.updatedAt), 86400000);
  assert.equal((await service.current('A')).id, first.id);
  const second = await service.add('A', input);
  assert.equal(second.items.length, 1); assert.equal(second.items[0].quantity, 4); assert.equal(second.total, 49.4);
  await assert.rejects(service.current('B'), { status: 404 });
});
test('update, remove, clear and missing order', async () => {
  const { service } = setup();
  await service.add('A', input);
  assert.equal((await service.update('A', input.productId, 3)).total, 37.05);
  assert.equal((await service.update('A', input.productId)).total, 0);
  await assert.rejects(service.confirm('A', 'token'), { status: 400 });
  await service.clear('A'); await assert.rejects(service.current('A'), { status: 404 });
});
test('success removes draft; ambiguous failure freezes it and retry succeeds', async () => {
  const { service, invoices } = setup();
  await service.add('A', input);
  const confirm = invoices.confirm;
  invoices.confirm = async () => { throw new HttpError(503, 'Timeout'); };
  await assert.rejects(service.confirm('A', 'token'), { status: 503 });
  assert.equal((await service.current('A')).status, 'CONFIRMING');
  await assert.rejects(service.add('A', input), { status: 409 });
  await assert.rejects(service.clear('A'), { status: 409 });
  invoices.confirm = confirm;
  assert.equal((await service.confirm('A', 'token')).invoice.number, 'INV');
  await assert.rejects(service.current('A'), { status: 404 });
});
test('definitive rejection preserves editable draft and original expiry', async () => {
  const { service, invoices } = setup();
  const before = await service.add('A', input);
  invoices.confirm = async () => { throw new HttpError(400, 'Invalid'); };
  await assert.rejects(service.confirm('A', 'token'), { status: 400 });
  const after = await service.current('A');
  assert.equal(after.status, 'DRAFT'); assert.equal(after.expiresAt, before.expiresAt);
});
test('catalog rejection never creates draft and revalidation prevents confirmation', async () => {
  const { service, catalog } = setup();
  const item = catalog.item;
  catalog.item = async () => { throw new HttpError(404, 'Missing'); };
  await assert.rejects(service.add('A', input), { status: 404 });
  await assert.rejects(service.current('A'), { status: 404 });
  catalog.item = item; await service.add('A', input);
  catalog.item = async () => { throw new HttpError(404, 'Missing'); };
  await assert.rejects(service.confirm('A', 'token'), { status: 404 });
  assert.equal((await service.current('A')).status, 'DRAFT');
});
test('HTTP validates .NET identity, JWT, role, input and real ping result', async t => {
  const { service } = setup();
  const secret = 'test-only-secret-with-at-least-32-characters';
  let healthy = true;
  const app = createApp(service, async () => { if (!healthy) throw new Error(); return 'PONG'; }, { secret, issuer: 'issuer', audience: 'audience', origins: [] });
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const token = jwt.sign({ 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': 'A', role: 'User' }, secret, { issuer: 'issuer', audience: 'audience', expiresIn: '1h' });
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  assert.equal((await fetch(`${base}/api/orders/current`)).status, 401);
  assert.equal((await fetch(`${base}/api/orders/current`, { headers: { Authorization: 'Bearer invalid' } })).status, 401);
  const invalidTokens = [
    jwt.sign({ sub: 'A' }, secret, { issuer: 'wrong', audience: 'audience', expiresIn: '1h' }),
    jwt.sign({ sub: 'A' }, secret, { issuer: 'issuer', audience: 'wrong', expiresIn: '1h' }),
    jwt.sign({ sub: 'A' }, secret, { issuer: 'issuer', audience: 'audience', expiresIn: -1 }),
    jwt.sign({ sub: 'A' }, secret, { algorithm: 'HS384', issuer: 'issuer', audience: 'audience', expiresIn: '1h' })
  ];
  for (const invalid of invalidTokens) assert.equal((await fetch(`${base}/api/orders/current`, { headers: { Authorization: `Bearer ${invalid}` } })).status, 401);
  assert.equal((await fetch(`${base}/api/orders/current`, { headers })).status, 404);
  for (const quantity of [0, -1, 1.2, '2', null]) {
    assert.equal((await fetch(`${base}/api/orders/items`, { method: 'POST', headers, body: JSON.stringify({ ...input, quantity }) })).status, 400);
  }
  assert.equal((await fetch(`${base}/api/orders/items`, { method: 'POST', headers, body: JSON.stringify({ ...input, userId: 'B' }) })).status, 400);
  const created = await fetch(`${base}/api/orders/items`, { method: 'POST', headers, body: JSON.stringify(input) });
  assert.equal(created.status, 200); assert.equal((await created.json() as Order).userId, 'A');
  assert.equal((await fetch(`${base}/api/orders/confirm`, { method: 'POST', headers })).status, 403);
  assert.equal((await fetch(`${base}/health`)).status, 200);
  healthy = false; assert.equal((await fetch(`${base}/health`)).status, 503);
});

test('read never extends expiry; valid modification renews it', async () => {
  const { service } = setup();
  const before = await service.add('A', input);
  await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal((await service.current('A')).expiresAt, before.expiresAt);
  const after = await service.update('A', input.productId, 5);
  assert.ok(Date.parse(after.expiresAt) > Date.parse(before.expiresAt));
});

test('expired cart is missing and adding creates a new UUID', async () => {
  const { service, repository } = setup();
  const old = await service.add('A', input);
  repository.data.get('A')!.expiresAt = new Date(0).toISOString();
  await assert.rejects(service.current('A'), { status: 404 });
  await assert.rejects(service.confirm('A', 'token'), { status: 404 });
  assert.notEqual((await service.add('A', input)).id, old.id);
});

test('two products produce a single invoice result', async () => {
  const { service, invoices } = setup();
  await service.add('A', input);
  await service.add('A', { ...input, productId: 'c'.repeat(24), quantity: 1 });
  let calls = 0;
  const original = invoices.confirm;
  invoices.confirm = async () => { calls++; return original(); };
  const result = await service.confirm('A', 'token');
  assert.equal(calls, 1); assert.ok(result.invoice.id); assert.ok(!('invoices' in result));
});

test('different supplier for the same product is rejected without changes', async () => {
  const { service } = setup();
  const before = await service.add('A', input);
  await assert.rejects(service.add('A', { ...input, supplierId: 'd'.repeat(24) }), { status: 409 });
  assert.deepEqual(await service.current('A'), before);
});

test('missing item is rejected and other lines survive removal', async () => {
  const { service } = setup();
  await service.add('A', input);
  await assert.rejects(service.update('A', 'c'.repeat(24), 1), { status: 404 });
  await service.add('A', { ...input, productId: 'c'.repeat(24), quantity: 1 });
  const result = await service.update('A', input.productId);
  assert.equal(result.items.length, 1); assert.equal(result.total, 12.35);
});

test('excess accumulated quantity is rejected', async () => {
  const { service } = setup();
  await service.add('A', { ...input, quantity: 100000 });
  await assert.rejects(service.add('A', input), { status: 400 });
  assert.equal((await service.current('A')).items[0].quantity, 100000);
});

for (const value of [0, -1, -10, NaN, Infinity, 1.5, '2']) {
  test(`quantity ${String(value)} is rejected by both request contracts`, () => {
    assert.equal(addItem.safeParse({ ...input, quantity: value }).success, false);
    assert.equal(updateItem.safeParse({ quantity: value }).success, false);
  });
}

test('forged identity, roles and money are rejected', () => {
  assert.equal(identifier.safeParse('0dfcefae-6604-385b-8a72-e19493f1b2ac').success, true);
  for (const field of ['userId', 'role', 'total', 'subtotal', 'unitPrice']) {
    assert.equal(addItem.safeParse({ ...input, [field]: 'forged' }).success, false);
  }
  assert.equal(identifier.safeParse('../products').success, false);
});

test('TTL overrides are restricted to tests', () => {
  const config = { REDIS_URL: 'redis://localhost:6379', JWT_SECRET: 'test-only-32-character-secret-value', JWT_ISSUER: 'issuer', JWT_AUDIENCE: 'audience', CATALOG_SERVICE_URL: 'http://localhost:8080', BACKEND_SERVICE_URL: 'http://localhost:5000' };
  assert.equal(loadEnv(config).ORDER_TTL_SECONDS, 86400);
  assert.throws(() => loadEnv({ ...config, ORDER_TTL_SECONDS: '5' }));
  assert.equal(loadEnv({ ...config, NODE_ENV: 'test', ORDER_TTL_SECONDS: '5' }).ORDER_TTL_SECONDS, 5);
});

test('Redis write failure does not report success', async () => {
  const { service, repository } = setup();
  repository.save = async () => { throw new HttpError(503, 'Redis unavailable'); };
  await assert.rejects(service.add('A', input), { status: 503 });
  assert.equal(repository.data.size, 0);
});
