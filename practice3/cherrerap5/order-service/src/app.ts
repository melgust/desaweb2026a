import express from 'express';
import cors from 'cors';
import { authenticate } from './middleware/auth.middleware.js';
import { errorMiddleware, HttpError } from './middleware/error.middleware.js';
import { addItem, updateItem, identifier } from './validators/order.js';
import type { OrderService } from './services/order.service.js';
export function createApp(service: OrderService, ping: () => Promise<unknown>, config: { secret: string; issuer: string; audience: string; origins: string[] }) {
  const app = express();
  app.disable('x-powered-by'); app.use(cors({ origin: config.origins })); app.use(express.json({ limit: '32kb' }));
  app.get('/health', async (_req, res) => {
    try { if (await ping() !== 'PONG') throw new Error(); res.json({ status: 'UP', redis: 'UP' }); }
    catch { res.status(503).json({ status: 'DOWN', redis: 'DOWN' }); }
  });
  const router = express.Router(); router.use(authenticate(config.secret, config.issuer, config.audience));
  router.get('/current', async (_req, res) => { res.json(await service.current(res.locals.userId)); });
  router.post('/items', async (req, res) => { res.status(200).json(await service.add(res.locals.userId, addItem.parse(req.body))); });
  router.put('/items/:productId', async (req, res) => { res.json(await service.update(res.locals.userId, identifier.parse(req.params.productId), updateItem.parse(req.body).quantity)); });
  router.delete('/items/:productId', async (req, res) => { res.json(await service.update(res.locals.userId, identifier.parse(req.params.productId))); });
  router.delete('/current', async (_req, res) => { await service.clear(res.locals.userId); res.sendStatus(204); });
  router.post('/confirm', async (_req, res) => {
    if (!['Admin', 'Manager'].includes(res.locals.role)) throw new HttpError(403, 'Solo Admin y Manager pueden generar facturas');
    res.json(await service.confirm(res.locals.userId, res.locals.token));
  });
  app.use('/api/orders', router);
  app.use((_req, res) => { res.status(404).json({ message: 'Ruta no encontrada' }); });
  app.use(errorMiddleware); return app;
}
