import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('password_reset_tokens', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token_hash', 64).notNullable().unique();
    table.timestamp('expires_at', { useTz: true }).notNullable();
    table.timestamp('used_at', { useTz: true });
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.schema.raw(`CREATE INDEX idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash)`);
  await knex.schema.raw(`CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id)`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('password_reset_tokens');
}
