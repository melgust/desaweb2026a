import { z } from 'zod';
import { requestJson } from './http.client.js';
import { HttpError } from '../middleware/error.middleware.js';
const reference = z.object({ id: z.string(), name: z.string(), isActive: z.boolean() });
const product = reference.extend({ price: z.number().finite().nonnegative().max(100000000) });
export class CatalogClient {
  constructor(private baseUrl: string) {}
  async item(productId: string, supplierId: string) {
    const [p, s] = await Promise.all([
      this.get(`${this.baseUrl}/api/products/${encodeURIComponent(productId)}`),
      this.get(`${this.baseUrl}/api/suppliers/${encodeURIComponent(supplierId)}`)
    ]);
    const parsedProduct = product.safeParse(p), parsedSupplier = reference.safeParse(s);
    if (!parsedProduct.success || !parsedSupplier.success) throw new HttpError(502, 'Contrato de catálogo inválido');
    if (!parsedProduct.data.isActive || !parsedSupplier.data.isActive) throw new HttpError(400, `Producto ${productId} o proveedor inactivo`);
    return { productId, productName: parsedProduct.data.name, supplierId, supplierName: parsedSupplier.data.name, unitPrice: Math.round(parsedProduct.data.price * 100) / 100 };
  }
  private async get(url: string) {
    try { return await requestJson(url); }
    catch (error) {
      if (error instanceof HttpError && error.status === 404) throw new HttpError(422, `Producto o proveedor inexistente: ${url.split('/').pop()}`);
      throw error;
    }
  }
}
