import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { HttpError } from './errors.js';

const identifierClaim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
const roleClaim = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

export function authenticate(req, res, next) {
  const match = /^Bearer (\S+)$/i.exec(req.headers.authorization || '');
  if (!match) throw new HttpError(401, 'Authentication is required.');
  let claims;
  try {
    claims = jwt.verify(match[1], config.jwtKey, {
      algorithms: ['HS256'], issuer: config.jwtIssuer, audience: config.jwtAudience
    });
  } catch { throw new HttpError(401, 'Invalid or expired token.'); }
  const userId = claims[identifierClaim] || claims.sub || claims.nameid;
  if (typeof userId !== 'string' || !/^[0-9a-f-]{36}$/i.test(userId) || !Number.isFinite(claims.exp)) {
    throw new HttpError(401, 'The token does not contain a valid user identity or expiration.');
  }
  req.userId = userId.toLowerCase();
  req.userRole = claims[roleClaim] || claims.role;
  next();
}

export function authorizeCart(req, res, next) {
  if (req.params.cartId !== 'me' && req.params.cartId.toLowerCase() !== req.userId) {
    throw new HttpError(403, 'You can only access your own cart.');
  }
  if (req.method !== 'GET' && !['Admin', 'Manager'].includes(req.userRole)) {
    throw new HttpError(403, 'Your role cannot modify carts.');
  }
  next();
}
