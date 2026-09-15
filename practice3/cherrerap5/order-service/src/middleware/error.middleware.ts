import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const errorMiddleware: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof ZodError) { res.status(400).json({ message: 'Datos inválidos', errors: error.flatten() }); return; }
  if (error instanceof HttpError) { res.status(error.status).json({ message: error.message }); return; }
  if (error instanceof SyntaxError) { res.status(400).json({ message: 'JSON inválido' }); return; }
  console.error('Request failed', error instanceof Error ? error.message : 'Unknown error');
  res.status(500).json({ message: 'Error interno' });
};
