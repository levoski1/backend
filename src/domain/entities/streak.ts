export const DISCIPLINE_TYPES = ['devotional', 'prayer', 'scripture_reading'] as const;
export type DisciplineType = typeof DISCIPLINE_TYPES[number];

export const STREAK_MILESTONES = [7, 14, 30, 60, 90] as const;

export interface StreakParams {
  id: string;
  userId: string;
  disciplineType: DisciplineType;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: Date | null;
  graceDayUsed: boolean;
  graceDayWeekStart: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StreakMilestone {
  milestone: number;
  reached: boolean;
}

export class Streak {
  public readonly id: string;
  public readonly userId: string;
  public readonly disciplineType: DisciplineType;
  public readonly currentStreak: number;
  public readonly longestStreak: number;
  public readonly lastCompletedDate: Date | null;
  public readonly graceDayUsed: boolean;
  public readonly graceDayWeekStart: Date | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(params: StreakParams) {
    this.id = params.id;
    this.userId = params.userId;
    this.disciplineType = params.disciplineType;
    this.currentStreak = params.currentStreak;
    this.longestStreak = params.longestStreak;
    this.lastCompletedDate = params.lastCompletedDate;
    this.graceDayUsed = params.graceDayUsed;
    this.graceDayWeekStart = params.graceDayWeekStart;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }

  static create(params: Omit<StreakParams, 'createdAt' | 'updatedAt'>): Streak {
    const now = new Date();
    return new Streak({
      ...params,
      createdAt: now,
      updatedAt: now,
    });
  }

  toParams(): StreakParams {
    return {
      id: this.id,
      userId: this.userId,
      disciplineType: this.disciplineType,
      currentStreak: this.currentStreak,
      longestStreak: this.longestStreak,
      lastCompletedDate: this.lastCompletedDate,
      graceDayUsed: this.graceDayUsed,
      graceDayWeekStart: this.graceDayWeekStart,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  getWeekStart(date: Date = new Date()): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  isSameDay(a: Date | null, b: Date | null): boolean {
    if (!a || !b) {
      return false;
    }
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  daysBetween(from: Date, to: Date): number {
    const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  private isGraceDayAvailable(today: Date): boolean {
    if (!this.graceDayUsed) {
      return true;
    }
    if (this.graceDayWeekStart === null) {
      return true;
    }
    const weekStart = this.getWeekStart(today);
    const storedWeekStart = this.getWeekStart(this.graceDayWeekStart);
    return storedWeekStart.getTime() !== weekStart.getTime();
  }

  recordCompletion(today: Date = new Date()): {
    streak: Streak;
    milestoneReached: StreakMilestone | null;
  } {
    const weekStart = this.getWeekStart(today);

    if (this.lastCompletedDate === null) {
      return {
        streak: new Streak({
          ...this.toParams(),
          currentStreak: 1,
          longestStreak: Math.max(1, this.longestStreak),
          lastCompletedDate: today,
          graceDayUsed: false,
          graceDayWeekStart: weekStart,
          updatedAt: new Date(),
        }),
        milestoneReached: this.checkMilestone(1),
      };
    }

    if (this.isSameDay(this.lastCompletedDate, today)) {
      return { streak: this, milestoneReached: null };
    }

    const gap = this.daysBetween(this.lastCompletedDate, today);

    if (gap === 1) {
      const newCount = this.currentStreak + 1;
      return {
        streak: new Streak({
          ...this.toParams(),
          currentStreak: newCount,
          longestStreak: Math.max(newCount, this.longestStreak),
          lastCompletedDate: today,
          graceDayWeekStart: weekStart,
          updatedAt: new Date(),
        }),
        milestoneReached: this.checkMilestone(newCount),
      };
    }

    if (gap === 2) {
      if (this.isGraceDayAvailable(today)) {
        const newCount = this.currentStreak + 1;
        return {
          streak: new Streak({
            ...this.toParams(),
            currentStreak: newCount,
            longestStreak: Math.max(newCount, this.longestStreak),
            lastCompletedDate: today,
            graceDayUsed: true,
            graceDayWeekStart: weekStart,
            updatedAt: new Date(),
          }),
          milestoneReached: this.checkMilestone(newCount),
        };
      }
      return {
        streak: new Streak({
          ...this.toParams(),
          currentStreak: 1,
          longestStreak: this.longestStreak,
          lastCompletedDate: today,
          graceDayUsed: false,
          graceDayWeekStart: weekStart,
          updatedAt: new Date(),
        }),
        milestoneReached: null,
      };
    }

    return {
      streak: new Streak({
        ...this.toParams(),
        currentStreak: 1,
        longestStreak: this.longestStreak,
        lastCompletedDate: today,
        graceDayUsed: false,
        graceDayWeekStart: weekStart,
        updatedAt: new Date(),
      }),
      milestoneReached: null,
    };
  }

  checkMilestone(count: number): StreakMilestone | null {
    if ((STREAK_MILESTONES as readonly number[]).includes(count)) {
      return { milestone: count, reached: true };
    }
    return null;
  }
}
