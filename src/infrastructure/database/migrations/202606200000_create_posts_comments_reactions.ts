import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('posts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('content').notNullable().checkLength('>=', 1);
    table.boolean('is_anonymous').notNullable().defaultTo(false);
    table.specificType('post_type', 'varchar(50)').notNullable()
      .defaultTo('general')
      .checkIn(['general', 'prayer_request', 'devotional_share', 'scripture']);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('comments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('post_id').notNullable().references('id').inTable('posts').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('content').notNullable().checkLength('>=', 1);
    table.boolean('is_anonymous').notNullable().defaultTo(false);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('reactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('post_id').notNullable().references('id').inTable('posts').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.specificType('reaction_type', 'varchar(20)').notNullable()
      .checkIn(['prayer', 'heart', 'amen']);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.unique(['post_id', 'user_id', 'reaction_type']);
  });

  await knex.raw('ALTER TABLE posts ENABLE ROW LEVEL SECURITY');
  await knex.raw(`
    CREATE POLICY posts_select_all ON posts
      FOR SELECT
      USING (true)
  `);
  await knex.raw(`
    CREATE POLICY posts_insert_own ON posts
      FOR INSERT
      WITH CHECK (user_id = auth.uid())
  `);
  await knex.raw(`
    CREATE POLICY posts_update_own ON posts
      FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid())
  `);
  await knex.raw(`
    CREATE POLICY posts_delete_own ON posts
      FOR DELETE
      USING (user_id = auth.uid())
  `);

  await knex.raw('ALTER TABLE comments ENABLE ROW LEVEL SECURITY');
  await knex.raw(`
    CREATE POLICY comments_select_all ON comments
      FOR SELECT
      USING (true)
  `);
  await knex.raw(`
    CREATE POLICY comments_insert_own ON comments
      FOR INSERT
      WITH CHECK (user_id = auth.uid())
  `);
  await knex.raw(`
    CREATE POLICY comments_delete_own ON comments
      FOR DELETE
      USING (user_id = auth.uid())
  `);

  await knex.raw('ALTER TABLE reactions ENABLE ROW LEVEL SECURITY');
  await knex.raw(`
    CREATE POLICY reactions_select_all ON reactions
      FOR SELECT
      USING (true)
  `);
  await knex.raw(`
    CREATE POLICY reactions_insert_own ON reactions
      FOR INSERT
      WITH CHECK (user_id = auth.uid())
  `);
  await knex.raw(`
    CREATE POLICY reactions_delete_own ON reactions
      FOR DELETE
      USING (user_id = auth.uid())
  `);

  await knex.schema.raw('CREATE INDEX idx_posts_created_at ON posts (created_at DESC)');
  await knex.schema.raw('CREATE INDEX idx_posts_user_id ON posts (user_id)');
  await knex.schema.raw('CREATE INDEX idx_posts_post_type ON posts (post_type)');
  await knex.schema.raw('CREATE INDEX idx_comments_post_id ON comments (post_id)');
  await knex.schema.raw('CREATE INDEX idx_reactions_post_id ON reactions (post_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw('DROP INDEX IF EXISTS idx_reactions_post_id');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_comments_post_id');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_posts_post_type');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_posts_user_id');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_posts_created_at');

  await knex.raw('DROP POLICY IF EXISTS reactions_delete_own ON reactions');
  await knex.raw('DROP POLICY IF EXISTS reactions_insert_own ON reactions');
  await knex.raw('DROP POLICY IF EXISTS reactions_select_all ON reactions');
  await knex.raw('ALTER TABLE reactions DISABLE ROW LEVEL SECURITY');

  await knex.raw('DROP POLICY IF EXISTS comments_delete_own ON comments');
  await knex.raw('DROP POLICY IF EXISTS comments_insert_own ON comments');
  await knex.raw('DROP POLICY IF EXISTS comments_select_all ON comments');
  await knex.raw('ALTER TABLE comments DISABLE ROW LEVEL SECURITY');

  await knex.raw('DROP POLICY IF EXISTS posts_delete_own ON posts');
  await knex.raw('DROP POLICY IF EXISTS posts_update_own ON posts');
  await knex.raw('DROP POLICY IF EXISTS posts_insert_own ON posts');
  await knex.raw('DROP POLICY IF EXISTS posts_select_all ON posts');
  await knex.raw('ALTER TABLE posts DISABLE ROW LEVEL SECURITY');

  await knex.schema.dropTableIfExists('reactions');
  await knex.schema.dropTableIfExists('comments');
  await knex.schema.dropTableIfExists('posts');
}
