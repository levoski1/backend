import type { Knex } from 'knex';
import { env } from './env.js';

const commonConfig: Knex.Config = {
  client: 'pg',
  migrations: {
    directory: './src/infrastructure/database/migrations',
    extension: 'ts',
    loadExtensions: ['.ts', '.js'],
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './src/infrastructure/database/seeds',
    extension: 'ts',
    loadExtensions: ['.ts', '.js'],
  },
  pool: {
    min: env.DB_POOL_MIN,
    max: env.DB_POOL_MAX,
    // Kill idle connections after 30s — Supabase drops them at ~5min
    idleTimeoutMillis: 30_000,
    // Check for and reap stale connections every 15s
    reapIntervalMillis: 15_000,
    // Ping the connection before handing it out to catch dropped ones
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    afterCreate(conn: any, done: (err: Error | null, conn: unknown) => void) {
      conn.query('SELECT 1', (err: Error | null) => {
        done(err, conn);
      });
    },
  },
  acquireConnectionTimeout: 10_000,
};

function connectionConfig(): Knex.Config {
  const base = {
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
  };

  if (env.NODE_ENV === 'production') {
    return {
      ...commonConfig,
      connection: {
        ...base,
        ssl: { rejectUnauthorized: false },
      },
    };
  }

  return {
    ...commonConfig,
    connection: base,
  };
}

const config = connectionConfig();

export default config;

export const knexConfig = config;
