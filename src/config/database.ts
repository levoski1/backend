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
