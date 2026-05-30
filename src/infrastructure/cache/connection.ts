import Redis from 'ioredis';
import { env } from '../../config/env.js';
import { logger } from '../../shared/logging/logger.js';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    if (env.REDIS_URL) {
      redis = new Redis(env.REDIS_URL, {
        retryStrategy: (times) => Math.min(times * 100, 3000),
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
        lazyConnect: true,
      });
    } else {
      redis = new Redis({
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        ...(env.REDIS_PASSWORD ? { password: env.REDIS_PASSWORD } : {}),
        retryStrategy: (times) => Math.min(times * 100, 3000),
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
        lazyConnect: true,
      });
    }

    redis.on('connect', () => logger.info('Redis connected'));
    redis.on('ready', () => logger.info('Redis ready'));
    redis.on('error', (err) => logger.error({ err }, 'Redis connection error'));
    redis.on('close', () => logger.warn('Redis connection closed'));
  }
  return redis;
}

export async function destroyRedis(): Promise<void> {
  if (redis) {
    redis.removeAllListeners();
    await redis.quit();
    redis = null;
    logger.info('Redis connection closed');
  }
}

export async function pingRedis(): Promise<boolean> {
  try {
    const result = await getRedis().ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}
