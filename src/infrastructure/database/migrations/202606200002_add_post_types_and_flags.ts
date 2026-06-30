import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('posts', (table) => {
    table.boolean('is_urgent').notNullable().defaultTo(false);
    table.boolean('allow_comments').notNullable().defaultTo(true);
  });

  await knex.raw('ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_post_type_check');
  await knex.raw(`
    ALTER TABLE posts ADD CONSTRAINT posts_post_type_check
    CHECK (post_type IN ('prayer', 'advice', 'testimony', 'gratitude'))
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_post_type_check');
  await knex.raw(`
    ALTER TABLE posts ADD CONSTRAINT posts_post_type_check
    CHECK (post_type IN ('general', 'prayer_request', 'devotional_share', 'scripture'))
  `);

  await knex.schema.alterTable('posts', (table) => {
    table.dropColumn('allow_comments');
    table.dropColumn('is_urgent');
  });
}
