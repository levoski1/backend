import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('devotionals', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title', 255).notNullable();
    table.string('scripture_reference', 255).notNullable();
    table.text('scripture_text').notNullable();
    table.text('reflection').notNullable();
    table.text('closing_prayer').notNullable();
    table.date('published_date').notNullable();
    table.string('author', 255).notNullable().defaultTo('Shelter Team');
    table.boolean('is_published').notNullable().defaultTo(true);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('devotional_completions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('devotional_id').notNullable().references('id').inTable('devotionals').onDelete('CASCADE');
    table.timestamp('completed_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.unique(['user_id', 'devotional_id']);
  });

  await knex.schema.createTable('streaks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.specificType('discipline_type', 'varchar(50)').notNullable()
      .checkIn(['devotional', 'prayer', 'scripture_reading']);
    table.integer('current_streak').notNullable().defaultTo(0);
    table.integer('longest_streak').notNullable().defaultTo(0);
    table.date('last_completed_date').nullable();
    table.boolean('grace_day_used').notNullable().defaultTo(false);
    table.date('grace_day_week_start').nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.unique(['user_id', 'discipline_type']);
  });

  await knex.raw('ALTER TABLE devotionals ENABLE ROW LEVEL SECURITY');
  await knex.raw(`
    CREATE POLICY devotionals_select_published ON devotionals
      FOR SELECT
      USING (is_published = true)
  `);
  await knex.raw(`
    CREATE POLICY devotionals_insert_admin ON devotionals
      FOR INSERT
      WITH CHECK (auth.role() = 'authenticated')
  `);
  await knex.raw(`
    CREATE POLICY devotionals_update_admin ON devotionals
      FOR UPDATE
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated')
  `);
  await knex.raw(`
    CREATE POLICY devotionals_delete_admin ON devotionals
      FOR DELETE
      USING (auth.role() = 'authenticated')
  `);

  await knex.raw('ALTER TABLE devotional_completions ENABLE ROW LEVEL SECURITY');
  await knex.raw(`
    CREATE POLICY devotional_completions_select_own ON devotional_completions
      FOR SELECT
      USING (user_id = auth.uid())
  `);
  await knex.raw(`
    CREATE POLICY devotional_completions_insert_own ON devotional_completions
      FOR INSERT
      WITH CHECK (user_id = auth.uid())
  `);

  await knex.raw('ALTER TABLE streaks ENABLE ROW LEVEL SECURITY');
  await knex.raw(`
    CREATE POLICY streaks_select_own ON streaks
      FOR SELECT
      USING (user_id = auth.uid())
  `);
  await knex.raw(`
    CREATE POLICY streaks_insert_own ON streaks
      FOR INSERT
      WITH CHECK (user_id = auth.uid())
  `);
  await knex.raw(`
    CREATE POLICY streaks_update_own ON streaks
      FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid())
  `);

  await knex.schema.raw('CREATE INDEX idx_devotionals_published_date ON devotionals (published_date DESC)');
  await knex.schema.raw('CREATE INDEX idx_devotionals_is_published ON devotionals (is_published)');
  await knex.schema.raw('CREATE INDEX idx_devotional_completions_user_id ON devotional_completions (user_id)');
  await knex.schema.raw('CREATE INDEX idx_devotional_completions_devotional_id ON devotional_completions (devotional_id)');
  await knex.schema.raw('CREATE INDEX idx_streaks_user_id ON streaks (user_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw('DROP INDEX IF EXISTS idx_streaks_user_id');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_devotional_completions_devotional_id');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_devotional_completions_user_id');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_devotionals_is_published');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_devotionals_published_date');

  await knex.raw('DROP POLICY IF EXISTS streaks_update_own ON streaks');
  await knex.raw('DROP POLICY IF EXISTS streaks_insert_own ON streaks');
  await knex.raw('DROP POLICY IF EXISTS streaks_select_own ON streaks');
  await knex.raw('ALTER TABLE streaks DISABLE ROW LEVEL SECURITY');

  await knex.raw('DROP POLICY IF EXISTS devotional_completions_insert_own ON devotional_completions');
  await knex.raw('DROP POLICY IF EXISTS devotional_completions_select_own ON devotional_completions');
  await knex.raw('ALTER TABLE devotional_completions DISABLE ROW LEVEL SECURITY');

  await knex.raw('DROP POLICY IF EXISTS devotionals_delete_admin ON devotionals');
  await knex.raw('DROP POLICY IF EXISTS devotionals_update_admin ON devotionals');
  await knex.raw('DROP POLICY IF EXISTS devotionals_insert_admin ON devotionals');
  await knex.raw('DROP POLICY IF EXISTS devotionals_select_published ON devotionals');
  await knex.raw('ALTER TABLE devotionals DISABLE ROW LEVEL SECURITY');

  await knex.schema.dropTableIfExists('streaks');
  await knex.schema.dropTableIfExists('devotional_completions');
  await knex.schema.dropTableIfExists('devotionals');
}
