import type { Knex } from 'knex';

const ROLES = ['user', 'circle_admin', 'content_author', 'counselor', 'admin'] as const;

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('display_name', 50).notNullable();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table
      .specificType('role', `varchar(20) NOT NULL DEFAULT 'user' CHECK (role IN (${ROLES.map((r) => `'${r}'`).join(',')}))`);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.boolean('is_verified').notNullable().defaultTo(false);
    table.timestamp('last_login_at', { useTz: true });
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at', { useTz: true });

    table.index('email');
    table.index('role');
    table.index('deleted_at');
  });

  await knex.schema.createTable('profiles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().unique().references('id').inTable('users').onDelete('CASCADE');
    table.string('display_name', 50).notNullable();
    table.text('bio');
    table.string('avatar_url', 512);
    table.specificType('spiritual_interests', 'jsonb').defaultTo(knex.raw("'[]'::jsonb"));
    table.string('timezone', 50).defaultTo('UTC');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index('user_id');
  });

  await knex.schema.createTable('refresh_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token_hash', 255).notNullable();
    table.string('device_fingerprint', 255);
    table.uuid('family_id').notNullable();
    table.timestamp('expires_at', { useTz: true }).notNullable();
    table.timestamp('revoked_at', { useTz: true });
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index('token_hash');
    table.index('user_id');
    table.index('family_id');
    table.index('expires_at');
  });

  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('action', 100).notNullable();
    table.string('resource', 100);
    table.uuid('resource_id');
    table.specificType('metadata', 'jsonb');
    table.string('ip_address', 45);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index('user_id');
    table.index('action');
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('refresh_tokens');
  await knex.schema.dropTableIfExists('profiles');
  await knex.schema.dropTableIfExists('users');
}
