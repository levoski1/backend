import { getDb } from '../connection.js';
import { DevotionalCompletion } from '../../../domain/index.js';
import type { Knex } from '../connection.js';

interface DevotionalCompletionRow {
  id: string;
  user_id: string;
  devotional_id: string;
  completed_at: string;
}

export class DevotionalCompletionRepository {
  private db: Knex;

  constructor(db?: Knex) {
    this.db = db ?? getDb();
  }

  async findByUserAndDevotional(userId: string, devotionalId: string): Promise<DevotionalCompletion | null> {
    const row = await this.db<DevotionalCompletionRow>('devotional_completions')
      .where({ user_id: userId, devotional_id: devotionalId })
      .first();

    if (!row) {
      return null;
    }

    return new DevotionalCompletion({
      id: row.id,
      userId: row.user_id,
      devotionalId: row.devotional_id,
      completedAt: new Date(row.completed_at),
    });
  }

  async findByUserAndDevotionalIds(userId: string, devotionalIds: string[]): Promise<DevotionalCompletion[]> {
    if (devotionalIds.length === 0) {
      return [];
    }

    const rows = await this.db<DevotionalCompletionRow>('devotional_completions')
      .where('user_id', userId)
      .whereIn('devotional_id', devotionalIds);

    return rows.map((row) => new DevotionalCompletion({
      id: row.id,
      userId: row.user_id,
      devotionalId: row.devotional_id,
      completedAt: new Date(row.completed_at),
    }));
  }

  async create(completion: DevotionalCompletion): Promise<DevotionalCompletion> {
    const [inserted] = await this.db<DevotionalCompletionRow>('devotional_completions')
      .insert({
        id: completion.id,
        user_id: completion.userId,
        devotional_id: completion.devotionalId,
      })
      .returning('*');

    return new DevotionalCompletion({
      id: inserted.id,
      userId: inserted.user_id,
      devotionalId: inserted.devotional_id,
      completedAt: new Date(inserted.completed_at),
    });
  }
}
