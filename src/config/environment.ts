import { env } from './env.js';

export function isLocal(): boolean {
  return (
    env.NODE_ENV === 'development' ||
    env.NODE_ENV === 'test' ||
    env.DB_HOST === 'localhost' ||
    env.DB_HOST === '127.0.0.1'
  );
}

export function isProduction(): boolean {
  return env.NODE_ENV === 'production' && !isLocal();
}
