import { config } from '../config/index.js';
import { HttpError } from '../middleware/errors.js';
import { money } from '../models/cart.js';

export async function getProduct(id) {
  let response;
  try {
    response = await fetch(`${config.catalogUrl}/api/products/${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(10000) });
  } catch { throw new HttpError(503, 'Product catalog is temporarily unavailable.'); }
  if (response.status === 404) throw new HttpError(404, `Product '${id}' was not found.`);
  if (!response.ok) throw new HttpError(503, 'Product catalog is temporarily unavailable.');
  let product;
  try { product = await response.json(); }
  catch { throw new HttpError(503, 'Product catalog returned an invalid response.'); }
  if (!product || product.id !== id || typeof product.name !== 'string' || !product.name.trim() || product.name.length > 500 ||
      typeof product.price !== 'number' || !Number.isFinite(product.price) || product.price < 0 ||
      !Number.isInteger(product.stock) || product.stock < 0) {
    throw new HttpError(503, 'Product catalog returned invalid product data.');
  }
  if (product.isActive !== true) throw new HttpError(409, `Product '${product.name}' is inactive.`);
  return { ...product, price: money(product.price) };
}
