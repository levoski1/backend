import { getDb } from '../connection.js';
import { Streak } from '../../../domain/index.js';
import type { DisciplineType } from '../../../domain/index.js';
import { InternalError } from '../../../shared/errors/index.js';
import type { Knex } from '../connection.js';

interface StreakRow {
  id: string;
  user_id: string;
  discipline_type: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  grace_day_used: boolean;
  grace_day_week_start: string | null;
  created_at: string;
  updated_at: string;
}

function rowToStreak(row: StreakRow): Streak {
  return new Streak({
    id: row.id,
    userId: row.user_id,
    disciplineType: row.discipline_type as DisciplineType,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    lastCompletedDate: row.last_completed_date ? new Date(row.last_completed_date) : null,
    graceDayUsed: row.grace_day_used,
    graceDayWeekStart: row.grace_day_week_start ? new Date(row.grace_day_week_start) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
}

function streakToRow(streak: Streak): Omit<StreakRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: streak.userId,
    discipline_type: streak.disciplineType,
    current_streak: streak.currentStreak,
    longest_streak: streak.longestStreak,
    last_completed_date: streak.lastCompletedDate
      ? streak.lastCompletedDate.toISOString().split('T')[0]
      : null,
    grace_day_used: streak.graceDayUsed,
    grace_day_week_start: streak.graceDayWeekStart
      ? streak.graceDayWeekStart.toISOString().split('T')[0]
      : null,
  };
}

export class StreakRepository {
  private db: Knex;

  constructor(db?: Knex) {
    this.db = db ?? getDb();
  }

  async findByUserAndDiscipline(userId: string, disciplineType: DisciplineType): Promise<Streak | null> {
    const row = await this.db<StreakRow>('streaks')
      .where({ user_id: userId, discipline_type: disciplineType })
      .first();

    if (!row) {
      return null;
    }
    return rowToStreak(row);
  }

  async findByUser(userId: string): Promise<Streak[]> {
    const rows = await this.db<StreakRow>('streaks')
      .where('user_id', userId);

    return rows.map(rowToStreak);
  }

  async upsert(streak: Streak): Promise<Streak> {
    const exists = await this.db<StreakRow>('streaks')
      .where({ user_id: streak.userId, discipline_type: streak.disciplineType })
      .first();

    if (exists) {
      const [updated] = await this.db<StreakRow>('streaks')
        .where({ id: streak.id })
        .update({
          current_streak: streak.currentStreak,
          longest_streak: streak.longestStreak,
          last_completed_date: streak.lastCompletedDate
            ? streak.lastCompletedDate.toISOString().split('T')[0]
            : null,
          grace_day_used: streak.graceDayUsed,
          grace_day_week_start: streak.graceDayWeekStart
            ? streak.graceDayWeekStart.toISOString().split('T')[0]
            : null,
          updated_at: new Date().toISOString(),
        })
        .returning('*');

      if (!updated) {
        throw new InternalError('Failed to update streak');
      }

      return rowToStreak(updated);
    }

    const [inserted] = await this.db<StreakRow>('streaks')
      .insert({
        id: streak.id,
        ...streakToRow(streak),
      })
      .returning('*');

    if (!inserted) {
      throw new InternalError('Failed to create streak');
    }

    return rowToStreak(inserted);
  }
}
