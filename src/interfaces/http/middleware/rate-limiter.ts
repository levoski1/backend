import rateLimit from 'express-rate-limit';
import RedisStore, { type RedisReply } from 'rate-limit-redis';
import { env } from '../../../config/env.js';
import { getRedis } from '../../../infrastructure/cache/connection.js';

function createStore(prefix: string) {
  try {
    const client = getRedis();
    return new RedisStore({
      prefix,
      sendCommand: (...args: [string, ...string[]]) =>
        client.call(...args) as Promise<RedisReply>,
    });
  } catch {
    return undefined;
  }
}

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  store: env.NODE_ENV === 'production' ? createStore('rl:global:') : undefined,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    },
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: env.NODE_ENV === 'production' ? createStore('rl:auth:') : undefined,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again later.',
    },
  },
});

export const counselingRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  store: env.NODE_ENV === 'production' ? createStore('rl:counseling:') : undefined,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Message rate exceeded. Please slow down.',
    },
  },
});
