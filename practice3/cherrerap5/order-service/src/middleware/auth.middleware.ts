import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { HttpError } from './error.middleware.js';
export function authenticate(secret: string, issuer: string, audience: string): RequestHandler {
  return (req, res, next) => {
    try {
      const token = /^Bearer (\S+)$/i.exec(req.headers.authorization ?? '')?.[1];
      if (!token) throw new Error('Missing token');
      const claims = jwt.verify(token, secret, { algorithms: ['HS256'], issuer, audience });
      if (typeof claims === 'string' || typeof claims.exp !== 'number') throw new Error('Invalid claims');
      const userId = claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ?? claims.nameid ?? claims.sub;
      if (typeof userId !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(userId)) throw new Error('Missing identity');
      res.locals.userId = userId;
      res.locals.role = claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? claims.role;
      res.locals.token = token;
      next();
    } catch { next(new HttpError(401, 'Token inválido o expirado')); }
  };
}
