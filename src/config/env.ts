import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().positive().max(65535).default(4000),
  API_PREFIX: z.string().default('/api/v1'),
  HOST: z.string().default('0.0.0.0'),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().min(4).max(16).default(12),

  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().positive().max(65535).default(5432),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().default(''),
  DB_POOL_MIN: z.coerce.number().min(0).default(2),
  DB_POOL_MAX: z.coerce.number().min(1).default(20),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().positive().max(65535).default(6379),
  REDIS_PASSWORD: z.string().default(''),

  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().default(''),
  S3_MEDIA_BUCKET: z.string().default('shelter-media-development'),
  S3_SIGNED_URL_EXPIRY: z.coerce.number().default(3600),

  CONTENT_MODERATION_ENABLED: z
    .string()
    .transform((v) => v === 'true' || v === '1')
    .default('true'),

  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('pretty'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
