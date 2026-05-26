import http from 'node:http';
import { env } from './config/env.js';
import { logger } from './shared/logging/logger.js';
import { getDb, destroyDb } from './infrastructure/database/connection.js';
import { getRedis, destroyRedis } from './infrastructure/cache/connection.js';
import app from './app.js';

const server = http.createServer(app);

async function gracefulShutdown(signal: string) {
  logger.info({ signal }, 'Received shutdown signal — draining connections');

  server.close(async () => {
    logger.info('HTTP server closed');
    await destroyDb();
    await destroyRedis();
    logger.info('All connections closed — exiting process');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30_000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection — shutting down');
  gracefulShutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
  logger.error({ err: error }, 'Uncaught exception — shutting down');
  gracefulShutdown('uncaughtException');
});

try {
  getDb();
  logger.info('Database connection pool initialized');
} catch (error) {
  logger.error({ err: error }, 'Failed to initialize database pool');
  process.exit(1);
}

try {
  getRedis();
  logger.info('Redis client initialized');
} catch (error) {
  logger.error({ err: error }, 'Failed to initialize Redis client');
  process.exit(1);
}

server.listen(env.PORT, env.HOST, () => {
  logger.info(
    {
      port: env.PORT,
      host: env.HOST,
      env: env.NODE_ENV,
      apiPrefix: env.API_PREFIX,
    },
    'Shelter API server started',
  );
});

export default server;
