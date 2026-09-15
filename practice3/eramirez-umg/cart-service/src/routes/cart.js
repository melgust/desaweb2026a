import { Router } from 'express';
import { authenticate, authorizeCart } from '../middleware/auth.js';
import { productId, quantity } from '../models/cart.js';

export function cartRoutes(service) {
  const router = Router();
  router.use(authenticate);
  router.use('/:cartId', authorizeCart);
  router.get('/:cartId', async (req, res) => res.json(await service.get(req.userId)));
  router.post('/:cartId/items', async (req, res) => {
    const cart = await service.add(req.userId, productId(req.body?.productId), quantity(req.body?.quantity));
    res.status(201).json(cart);
  });
  router.put('/:cartId/items/:productId', async (req, res) => {
    res.json(await service.update(req.userId, productId(req.params.productId), quantity(req.body?.quantity)));
  });
  router.delete('/:cartId/items/:productId', async (req, res) => {
    res.json(await service.remove(req.userId, productId(req.params.productId)));
  });
  router.delete('/:cartId', async (req, res) => {
    await service.clear(req.userId, req.get('If-Match'));
    res.sendStatus(204);
  });
  return router;
}
