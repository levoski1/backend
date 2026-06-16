import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.string('provider_id', 255).nullable().after('password_hash');
    table.index('provider_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropIndex('provider_id');
    table.dropColumn('provider_id');
  });
}
