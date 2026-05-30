import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // ─── users ───────────────────────────────────────────
  await knex.raw('ALTER TABLE users ENABLE ROW LEVEL SECURITY');

  await knex.raw(`
    CREATE POLICY users_select_own ON users
      FOR SELECT
      USING (id = auth.uid())
  `);

  await knex.raw(`
    CREATE POLICY users_update_own ON users
      FOR UPDATE
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid())
  `);

  // ─── profiles ────────────────────────────────────────
  await knex.raw('ALTER TABLE profiles ENABLE ROW LEVEL SECURITY');

  await knex.raw(`
    CREATE POLICY profiles_select_public ON profiles
      FOR SELECT
      USING (true)
  `);

  await knex.raw(`
    CREATE POLICY profiles_insert_own ON profiles
      FOR INSERT
      WITH CHECK (user_id = auth.uid())
  `);

  await knex.raw(`
    CREATE POLICY profiles_update_own ON profiles
      FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid())
  `);

  await knex.raw(`
    CREATE POLICY profiles_delete_own ON profiles
      FOR DELETE
      USING (user_id = auth.uid())
  `);

  // ─── refresh_tokens ──────────────────────────────────
  await knex.raw('ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY');

  await knex.raw(`
    CREATE POLICY refresh_tokens_select_own ON refresh_tokens
      FOR SELECT
      USING (user_id = auth.uid())
  `);

  // ─── audit_logs ──────────────────────────────────────
  await knex.raw('ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY');

  await knex.raw(`
    CREATE POLICY audit_logs_insert_authenticated ON audit_logs
      FOR INSERT
      WITH CHECK (auth.role() = 'authenticated')
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP POLICY IF EXISTS users_select_own ON users');
  await knex.raw('DROP POLICY IF EXISTS users_update_own ON users');
  await knex.raw('ALTER TABLE users DISABLE ROW LEVEL SECURITY');

  await knex.raw('DROP POLICY IF EXISTS profiles_select_public ON profiles');
  await knex.raw('DROP POLICY IF EXISTS profiles_insert_own ON profiles');
  await knex.raw('DROP POLICY IF EXISTS profiles_update_own ON profiles');
  await knex.raw('DROP POLICY IF EXISTS profiles_delete_own ON profiles');
  await knex.raw('ALTER TABLE profiles DISABLE ROW LEVEL SECURITY');

  await knex.raw('DROP POLICY IF EXISTS refresh_tokens_select_own ON refresh_tokens');
  await knex.raw('ALTER TABLE refresh_tokens DISABLE ROW LEVEL SECURITY');

  await knex.raw('DROP POLICY IF EXISTS audit_logs_insert_authenticated ON audit_logs');
  await knex.raw('ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY');
}
