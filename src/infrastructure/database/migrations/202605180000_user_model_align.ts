import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Rename display_name -> full_name on users
  await knex.schema.alterTable('users', (table) => {
    table.renameColumn('display_name', 'full_name');
  });

  // 2. Add auth_provider column
  await knex.schema.alterTable('users', (table) => {
    table.string('auth_provider', 20).notNullable().defaultTo('email')
      .after('password_hash');
  });

  // 3. Migrate is_active -> account_status
  await knex.schema.alterTable('users', (table) => {
    table.string('account_status', 20).defaultTo('active').after('auth_provider');
  });

  await knex('users').update({ account_status: knex.raw("CASE WHEN is_active = true THEN 'active' ELSE 'suspended' END") });

  await knex.schema.alterTable('users', (table) => {
    table.string('account_status', 20).notNullable().defaultTo('active').alter();
  });

  // 4. Add CHECK constraint for account_status
  await knex.raw(`
    ALTER TABLE users
    ADD CONSTRAINT users_account_status_check
    CHECK (account_status IN ('active', 'suspended', 'banned'))
  `);

  // 5. Rename is_verified -> email_verified
  await knex.schema.alterTable('users', (table) => {
    table.renameColumn('is_verified', 'email_verified');
  });

  // 6. Add profile_photo_url
  await knex.schema.alterTable('users', (table) => {
    table.string('profile_photo_url', 512).after('email_verified');
  });

  // 7. Add privacy_settings JSONB
  await knex.schema.alterTable('users', (table) => {
    table.specificType('privacy_settings', 'jsonb')
      .defaultTo(knex.raw("'{\"profileVisibility\":\"public\",\"showFaithInfo\":true}'::jsonb"))
      .after('profile_photo_url');
  });

  // 8. Drop is_active (data migrated to account_status)
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('is_active');
  });

  // 9. Add denomination to profiles table
  await knex.schema.alterTable('profiles', (table) => {
    table.string('denomination', 100).after('bio');
  });
}

export async function down(knex: Knex): Promise<void> {
  // 1. Drop denomination from profiles
  await knex.schema.alterTable('profiles', (table) => {
    table.dropColumn('denomination');
  });

  // 2. Restore is_active from account_status
  await knex.schema.alterTable('users', (table) => {
    table.boolean('is_active').notNullable().defaultTo(true);
  });

  await knex('users').update({ is_active: knex.raw("CASE WHEN account_status = 'active' THEN true ELSE false END") });

  // 3. Drop new columns
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('auth_provider');
    table.dropColumn('account_status');
    table.dropColumn('profile_photo_url');
    table.dropColumn('privacy_settings');
  });

  // 4. Drop CHECK constraint
  await knex.raw('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_account_status_check');

  // 5. Rename email_verified -> is_verified
  await knex.schema.alterTable('users', (table) => {
    table.renameColumn('email_verified', 'is_verified');
  });

  // 6. Rename full_name -> display_name
  await knex.schema.alterTable('users', (table) => {
    table.renameColumn('full_name', 'display_name');
  });
}
