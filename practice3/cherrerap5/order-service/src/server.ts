import { createClient } from 'redis';
import { loadEnv } from './config/env.js';
import { createApp } from './app.js';
import { RedisOrderRepository } from './services/redis-order.repository.js';
import { CatalogClient } from './services/catalog.client.js';
import { InvoiceClient } from './services/invoice.client.js';
import { OrderService } from './services/order.service.js';
const env = loadEnv();
const redis = createClient({ url: env.REDIS_URL, disableOfflineQueue: true, commandOptions: { timeout: 3000 }, socket: { connectTimeout: 5000 } });
redis.on('error', () => console.error('Redis connection unavailable'));
void redis.connect().catch(() => console.error('Redis initial connection failed'));
const service = new OrderService(new RedisOrderRepository(redis, env.ORDER_TTL_SECONDS), new CatalogClient(env.CATALOG_SERVICE_URL), new InvoiceClient(env.BACKEND_SERVICE_URL), env.ORDER_TTL_SECONDS);
const app = createApp(service, async () => {
  if (!redis.isReady) throw new Error('Redis unavailable'); return redis.ping();
}, { secret: env.JWT_SECRET, issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE, origins: env.CORS_ALLOWED_ORIGINS.split(',').map(s => s.trim()) });
const server = app.listen(env.PORT, () => console.info(`Order Service listening on ${env.PORT}`));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => {
  server.close(() => { if (redis.isOpen) redis.destroy(); });
  setTimeout(() => process.exit(0), 10000).unref();
});
