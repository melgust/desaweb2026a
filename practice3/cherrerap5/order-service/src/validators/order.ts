import { z } from 'zod';
// Catalog seeds use UUIDs; newly created Mongo records may use ObjectIds.
export const identifier = z.union([z.string().uuid(), z.string().regex(/^[a-fA-F0-9]{24}$/)]);
export const quantity = z.number().int().min(1).max(100000);
export const addItem = z.object({ productId: identifier, supplierId: identifier, quantity }).strict();
export const updateItem = z.object({ quantity }).strict();
