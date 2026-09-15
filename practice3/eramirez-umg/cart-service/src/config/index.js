function positiveInteger(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer.`);
  return value;
}

export const config = {
  port: positiveInteger('PORT', 3000),
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: positiveInteger('REDIS_PORT', 6379),
  ttl: positiveInteger('CART_TTL_SECONDS', 86400),
  catalogUrl: (process.env.CATALOG_SERVICE_URL || 'http://localhost:8080').replace(/\/$/, ''),
  frontendOrigins: (process.env.FRONTEND_ORIGIN || 'http://localhost:4200').split(',').map(value => value.trim()),
  jwtKey: process.env.JWT_KEY,
  jwtIssuer: process.env.JWT_ISSUER,
  jwtAudience: process.env.JWT_AUDIENCE
};

if (!config.jwtKey || Buffer.byteLength(config.jwtKey) < 32 || !config.jwtIssuer || !config.jwtAudience) {
  throw new Error('JWT_KEY (at least 32 bytes), JWT_ISSUER and JWT_AUDIENCE are required. Use the backend JWT settings.');
}
