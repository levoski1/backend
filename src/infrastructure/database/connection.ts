import knex, { type Knex } from 'knex';
import config from '../../config/database.js';
import { logger } from '../../shared/logging/logger.js';

let db: Knex | null = null;

export function getDb(): Knex {
  if (!db) {
    db = knex(config);
    logger.info('Database connection pool created');
  }
  return db;
}

export async function destroyDb(): Promise<void> {
  if (db) {
    await db.destroy();
    db = null;
    logger.info('Database connection pool destroyed');
  }
}

export async function pingDb(): Promise<boolean> {
  try {
    const result = await getDb().raw('SELECT 1 AS ok');
    return result.rows?.[0]?.ok === 1;
  } catch {
    return false;
  }
}

export { Knex };
