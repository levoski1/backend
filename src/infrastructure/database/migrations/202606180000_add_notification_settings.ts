import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('profiles', (table) => {
    table.specificType('notification_settings', 'jsonb')
      .defaultTo(knex.raw("'{\"prayerReminders\":true,\"communityUpdates\":true,\"streakAlerts\":true}'::jsonb"));
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('profiles', (table) => {
    table.dropColumn('notification_settings');
  });
}
