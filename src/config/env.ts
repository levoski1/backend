import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // ─── Server ──────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().positive().max(65535).default(4000),
  API_PREFIX: z.string().default('/api/v1'),
  HOST: z.string().default('0.0.0.0'),
  REQUEST_TIMEOUT_MS: z.coerce.number().positive().default(30000),
  RENDER_EXTERNAL_URL: z.string().default(''),

  // ─── CORS ────────────────────────────────────────────
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000,http://localhost:4000')
    .transform((v) => v.split(',').map((s) => s.trim().replace(/\/$/, ''))),

  // ─── Rate Limiting ───────────────────────────────────
  RATE_LIMIT_WINDOW_MS: z.coerce.number().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().positive().default(100),

  // ─── Authentication ──────────────────────────────────
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().min(4).max(16).default(12),

  // ─── Database ────────────────────────────────────────
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().positive().max(65535).default(5432),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().default(''),
  DB_POOL_MIN: z.coerce.number().min(0).default(2),
  DB_POOL_MAX: z.coerce.number().min(1).default(20),

  // ─── Redis ───────────────────────────────────────────
  REDIS_URL: z.string().default(''),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().positive().max(65535).default(6379),
  REDIS_PASSWORD: z.string().default(''),

  // ─── AWS ─────────────────────────────────────────────
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().default(''),
  S3_MEDIA_BUCKET: z.string().default('shelter-media-development'),
  S3_SIGNED_URL_EXPIRY: z.coerce.number().default(3600),

  // ─── Email ───────────────────────────────────────────
  RESEND_API_KEY: z.string().default(''),
  EMAIL_FROM: z.string().default('noreply@shelter.app'),

  // ─── Moderation ──────────────────────────────────────
  CONTENT_MODERATION_ENABLED: z
    .string()
    .transform((v) => v === 'true' || v === '1')
    .default('true'),

  // ─── Logging ─────────────────────────────────────────
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('pretty'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
