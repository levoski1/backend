import { STREAK_MILESTONES } from '../../domain/index.js';
import type { Streak, DisciplineType } from '../../domain/index.js';
import { StreakRepository } from '../../infrastructure/database/repositories/streak-repository.js';

export class StreakService {
  constructor(
    private readonly streakRepo: StreakRepository = new StreakRepository(),
  ) {}

  async getStreak(userId: string, disciplineType?: DisciplineType) {
    if (disciplineType) {
      const streak = await this.streakRepo.findByUserAndDiscipline(userId, disciplineType);
      return streak ? this.serializeStreak(streak) : this.emptyStreak(userId, disciplineType);
    }

    const streaks = await this.streakRepo.findByUser(userId);
    const allDisciplines: DisciplineType[] = ['devotional', 'prayer', 'scripture_reading'];

    const result = allDisciplines.map((type) => {
      const found = streaks.find((s) => s.disciplineType === type);
      return found ? this.serializeStreak(found) : this.emptyStreak(userId, type);
    });

    return result;
  }

  async getAllStreaks(userId: string) {
    return this.getStreak(userId);
  }

  private serializeStreak(streak: Streak) {
    const milestones = STREAK_MILESTONES.map((m) => ({
      milestone: m,
      reached: streak.longestStreak >= m,
    }));

    return {
      id: streak.id,
      userId: streak.userId,
      disciplineType: streak.disciplineType,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastCompletedDate: streak.lastCompletedDate?.toISOString().split('T')[0] ?? null,
      graceDayUsed: streak.graceDayUsed,
      milestones,
    };
  }

  private emptyStreak(userId: string, disciplineType: DisciplineType) {
    const milestones = STREAK_MILESTONES.map((m) => ({
      milestone: m,
      reached: false,
    }));

    return {
      id: null,
      userId,
      disciplineType,
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null,
      graceDayUsed: false,
      milestones,
    };
  }
}
