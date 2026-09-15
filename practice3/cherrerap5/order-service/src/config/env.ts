import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  REDIS_URL: z.string().url(),
  ORDER_TTL_SECONDS: z.coerce.number().int().positive().max(86400).default(86400),
  CATALOG_SERVICE_URL: z.string().url().transform(s => s.replace(/\/$/, '')),
  BACKEND_SERVICE_URL: z.string().url().transform(s => s.replace(/\/$/, '')),
  JWT_SECRET: z.string().min(32), JWT_ISSUER: z.string().min(1), JWT_AUDIENCE: z.string().min(1),
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:4200,http://localhost:81')
}).refine(env => env.NODE_ENV === 'test' || env.ORDER_TTL_SECONDS === 86400, {
  message: 'TTL must be 86400 outside tests', path: ['ORDER_TTL_SECONDS']
});
export function loadEnv(input: NodeJS.ProcessEnv = process.env) { return schema.parse(input); }
