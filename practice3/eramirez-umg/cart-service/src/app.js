import express from 'express';
import { createClient } from 'redis';
import { config } from './config/index.js';
import { HttpError, errorHandler } from './middleware/errors.js';
import { CartService } from './services/cart.js';
import { cartRoutes } from './routes/cart.js';

const redis = createClient({
  socket: { host: config.redisHost, port: config.redisPort, connectTimeout: 5000 },
  disableOfflineQueue: true
});
redis.on('error', () => console.error('Redis connection unavailable.'));
redis.connect().catch(() => console.error('Redis connection failed.'));

const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && config.frontendOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.vary('Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, If-Match');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use(express.json({ limit: '64kb' }));
const carts = new CartService(redis);
app.get('/health', async (req, res) => {
  await carts.command(() => redis.ping());
  res.json({ status: 'UP' });
});
app.use('/api/cart', cartRoutes(carts));
app.use(() => { throw new HttpError(404, 'Endpoint not found.'); });
app.use(errorHandler);
const server = app.listen(config.port, '0.0.0.0', () => console.log(`Cart service listening on ${config.port}`));

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, () => {
    server.close(() => { if (redis.isOpen) redis.destroy(); });
    setTimeout(() => process.exit(0), 5000).unref();
  });
}
