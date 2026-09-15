import { HttpError } from '../middleware/error.middleware.js';
export async function requestJson(url: string, init?: RequestInit): Promise<unknown> {
  let response: Response;
  try { response = await fetch(url, { ...init, signal: AbortSignal.timeout(15000) }); }
  catch { throw new HttpError(503, 'Servicio externo no disponible; puedes reintentar'); }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message = body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
      ? body.message.slice(0, 400) : `Servicio externo rechazó la operación (${response.status})`;
    throw new HttpError(response.status >= 500 ? 503 : response.status, message);
  }
  try { return await response.json(); } catch { throw new HttpError(502, 'Respuesta externa inválida'); }
}
