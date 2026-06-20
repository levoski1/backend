import crypto from 'node:crypto';
import { Devotional, DevotionalCompletion, Streak } from '../../domain/index.js';
import type { DisciplineType } from '../../domain/index.js';
import { DevotionalRepository } from '../../infrastructure/database/repositories/devotional-repository.js';
import { DevotionalCompletionRepository } from '../../infrastructure/database/repositories/devotional-completion-repository.js';
import { StreakRepository } from '../../infrastructure/database/repositories/streak-repository.js';
import { NotFoundError, ConflictError } from '../../shared/errors/index.js';

export interface CreateDevotionalParams {
  title: string;
  scriptureReference: string;
  scriptureText: string;
  reflection: string;
  closingPrayer: string;
  publishedDate: Date;
  author?: string;
  isPublished?: boolean;
}

export interface UpdateDevotionalParams {
  title?: string;
  scriptureReference?: string;
  scriptureText?: string;
  reflection?: string;
  closingPrayer?: string;
  publishedDate?: Date;
  author?: string;
  isPublished?: boolean;
}

export class DevotionalService {
  constructor(
    private readonly devotionalRepo: DevotionalRepository = new DevotionalRepository(),
    private readonly completionRepo: DevotionalCompletionRepository = new DevotionalCompletionRepository(),
    private readonly streakRepo: StreakRepository = new StreakRepository(),
  ) {}

  async getToday(userId?: string) {
    const devotional = await this.devotionalRepo.findToday();

    if (!devotional) {
      throw new NotFoundError('Devotional');
    }

    let isCompleted = false;
    if (userId) {
      const completion = await this.completionRepo.findByUserAndDevotional(userId, devotional.id);
      isCompleted = completion !== null;
    }

    return {
      ...this.serializeDevotional(devotional),
      isCompleted,
    };
  }

  async getByDate(date: string, userId?: string) {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new NotFoundError('Devotional');
    }

    const devotional = await this.devotionalRepo.findByDate(parsedDate);

    if (!devotional) {
      throw new NotFoundError('Devotional');
    }

    let isCompleted = false;
    if (userId) {
      const completion = await this.completionRepo.findByUserAndDevotional(userId, devotional.id);
      isCompleted = completion !== null;
    }

    return {
      ...this.serializeDevotional(devotional),
      isCompleted,
    };
  }

  async getArchive(userId?: string) {
    const rows = await this.devotionalRepo.findArchive(30);

    let completions: DevotionalCompletion[] = [];
    if (userId && rows.length > 0) {
      const ids = rows.map((r) => r.id);
      completions = await this.completionRepo.findByUserAndDevotionalIds(userId, ids);
    }

    const completedIds = new Set(completions.map((c) => c.devotionalId));

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      scriptureReference: row.scripture_reference,
      publishedDate: row.published_date,
      author: row.author,
      isCompleted: completedIds.has(row.id),
    }));
  }

  async getById(id: string, userId?: string) {
    const devotional = await this.devotionalRepo.findById(id);

    if (!devotional) {
      throw new NotFoundError('Devotional');
    }

    let isCompleted = false;
    if (userId) {
      const completion = await this.completionRepo.findByUserAndDevotional(userId, devotional.id);
      isCompleted = completion !== null;
    }

    return {
      ...this.serializeDevotional(devotional),
      isCompleted,
    };
  }

  async completeDevotional(devotionalId: string, userId: string) {
    const devotional = await this.devotionalRepo.findById(devotionalId);

    if (!devotional) {
      throw new NotFoundError('Devotional');
    }

    const existing = await this.completionRepo.findByUserAndDevotional(userId, devotionalId);
    if (existing) {
      throw new ConflictError('Devotional already marked as completed');
    }

    const completion = DevotionalCompletion.create({
      id: crypto.randomUUID(),
      userId,
      devotionalId,
    });

    await this.completionRepo.create(completion);

    const disciplineType: DisciplineType = 'devotional';
    let existingStreak = await this.streakRepo.findByUserAndDiscipline(userId, disciplineType);

    if (!existingStreak) {
      existingStreak = Streak.create({
        id: crypto.randomUUID(),
        userId,
        disciplineType,
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: null,
        graceDayUsed: false,
        graceDayWeekStart: null,
      });
    }

    const { streak, milestoneReached } = existingStreak.recordCompletion();
    await this.streakRepo.upsert(streak);

    return {
      streak: {
        id: streak.id,
        disciplineType: streak.disciplineType,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastCompletedDate: streak.lastCompletedDate?.toISOString().split('T')[0] ?? null,
        graceDayUsed: streak.graceDayUsed,
      },
      milestoneReached,
    };
  }

  async createDevotional(params: CreateDevotionalParams) {
    const devotional = Devotional.create({
      id: crypto.randomUUID(),
      title: params.title,
      scriptureReference: params.scriptureReference,
      scriptureText: params.scriptureText,
      reflection: params.reflection,
      closingPrayer: params.closingPrayer,
      publishedDate: params.publishedDate,
      author: params.author ?? 'Shelter Team',
      isPublished: params.isPublished ?? true,
    });

    const created = await this.devotionalRepo.create(devotional);
    return this.serializeDevotional(created);
  }

  async updateDevotional(id: string, params: UpdateDevotionalParams) {
    const devotional = await this.devotionalRepo.findById(id);

    if (!devotional) {
      throw new NotFoundError('Devotional');
    }

    const updated = devotional.update({
      ...(params.title !== undefined && { title: params.title }),
      ...(params.scriptureReference !== undefined && { scriptureReference: params.scriptureReference }),
      ...(params.scriptureText !== undefined && { scriptureText: params.scriptureText }),
      ...(params.reflection !== undefined && { reflection: params.reflection }),
      ...(params.closingPrayer !== undefined && { closingPrayer: params.closingPrayer }),
      ...(params.publishedDate !== undefined && { publishedDate: params.publishedDate }),
      ...(params.author !== undefined && { author: params.author }),
      ...(params.isPublished !== undefined && { isPublished: params.isPublished }),
    });

    const result = await this.devotionalRepo.update(updated);
    return this.serializeDevotional(result);
  }

  async deleteDevotional(id: string) {
    await this.devotionalRepo.delete(id);
  }

  private serializeDevotional(devotional: Devotional) {
    return {
      id: devotional.id,
      title: devotional.title,
      scriptureReference: devotional.scriptureReference,
      scriptureText: devotional.scriptureText,
      reflection: devotional.reflection,
      closingPrayer: devotional.closingPrayer,
      publishedDate: devotional.publishedDate.toISOString().split('T')[0],
      author: devotional.author,
      isPublished: devotional.isPublished,
      createdAt: devotional.createdAt,
      updatedAt: devotional.updatedAt,
    };
  }
}
