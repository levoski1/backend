import { DevotionalService } from '@application/devotional/devotional-service';
import type { DevotionalRepository } from '@infrastructure/database/repositories/devotional-repository';
import type { DevotionalCompletionRepository } from '@infrastructure/database/repositories/devotional-completion-repository';
import type { StreakRepository } from '@infrastructure/database/repositories/streak-repository';
import { Devotional, Streak } from '@domain/index';
import { NotFoundError, ConflictError } from '@shared/errors';

import crypto from 'node:crypto';
jest.mock('node:crypto', () => ({
  randomUUID: jest.fn(() => 'mocked-uuid'),
}));

const mockDevotionalRepo: Record<string, jest.Mock | undefined> = {
  findToday: jest.fn(),
  findByDate: jest.fn(),
  findArchive: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockCompletionRepo: Record<string, jest.Mock | undefined> = {
  findByUserAndDevotional: jest.fn(),
  findByUserAndDevotionalIds: jest.fn(),
  create: jest.fn(),
};

const mockStreakRepo: Record<string, jest.Mock | undefined> = {
  findByUserAndDiscipline: jest.fn(),
  findByUser: jest.fn(),
  upsert: jest.fn(),
};

function createDevotional(overrides: Record<string, unknown> = {}) {
  return new Devotional({
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Devotional',
    scriptureReference: 'John 3:16',
    scriptureText: 'For God so loved the world...',
    reflection: 'A reflection on God\'s love.',
    closingPrayer: 'Amen.',
    publishedDate: new Date('2026-06-20'),
    author: 'Test Author',
    isPublished: true,
    createdAt: new Date('2026-06-01'),
    updatedAt: new Date('2026-06-01'),
    ...overrides,
  });
}

describe('DevotionalService', () => {
  let service: DevotionalService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DevotionalService(
      mockDevotionalRepo as unknown as DevotionalRepository,
      mockCompletionRepo as unknown as DevotionalCompletionRepository,
      mockStreakRepo as unknown as StreakRepository,
    );
  });

  describe('getToday', () => {
    it('should return today\'s devotional', async () => {
      const devotional = createDevotional();
      mockDevotionalRepo.findToday!.mockResolvedValue(devotional);

      const result = await service.getToday();

      expect(result.title).toBe('Test Devotional');
      expect(result.isCompleted).toBe(false);
    });

    it('should include completion status when userId provided', async () => {
      const devotional = createDevotional();
      mockDevotionalRepo.findToday!.mockResolvedValue(devotional);
      mockCompletionRepo.findByUserAndDevotional!.mockResolvedValue({
        id: 'completion-1',
        userId: 'user-1',
        devotionalId: devotional.id,
        completedAt: new Date(),
      });

      const result = await service.getToday('user-1');

      expect(result.isCompleted).toBe(true);
    });

    it('should throw NotFoundError when no devotional exists', async () => {
      mockDevotionalRepo.findToday!.mockResolvedValue(null);

      await expect(service.getToday()).rejects.toThrow(NotFoundError);
    });
  });

  describe('getByDate', () => {
    it('should return devotional for valid date', async () => {
      const devotional = createDevotional();
      mockDevotionalRepo.findByDate!.mockResolvedValue(devotional);

      const result = await service.getByDate('2026-06-20');

      expect(result.title).toBe('Test Devotional');
    });

    it('should throw NotFoundError for invalid date string', async () => {
      await expect(service.getByDate('not-a-date')).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when no devotional for that date', async () => {
      mockDevotionalRepo.findByDate!.mockResolvedValue(null);

      await expect(service.getByDate('2026-06-20')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getArchive', () => {
    it('should return archive items', async () => {
      const devotional = createDevotional();
      mockDevotionalRepo.findArchive!.mockResolvedValue([
        {
          id: devotional.id,
          title: devotional.title,
          scripture_reference: devotional.scriptureReference,
          published_date: devotional.publishedDate.toISOString().split('T')[0],
          author: devotional.author,
        },
      ]);

      const result = await service.getArchive();

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Devotional');
    });
  });

  describe('getById', () => {
    it('should return devotional by ID', async () => {
      const devotional = createDevotional();
      mockDevotionalRepo.findById!.mockResolvedValue(devotional);

      const result = await service.getById(devotional.id);

      expect(result.id).toBe(devotional.id);
    });

    it('should throw NotFoundError when devotional not found', async () => {
      mockDevotionalRepo.findById!.mockResolvedValue(null);

      await expect(service.getById('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('completeDevotional', () => {
    it('should mark devotional as completed and update streak', async () => {
      const devotional = createDevotional();
      mockDevotionalRepo.findById!.mockResolvedValue(devotional);
      mockCompletionRepo.findByUserAndDevotional!.mockResolvedValue(null);
      mockCompletionRepo.create!.mockResolvedValue({});
      mockStreakRepo.findByUserAndDiscipline!.mockResolvedValue(null);
      mockStreakRepo.upsert!.mockImplementation(async (streak: Streak) => streak);

      const result = await service.completeDevotional(devotional.id, 'user-1');

      expect(mockCompletionRepo.create).toHaveBeenCalledTimes(1);
      expect(mockStreakRepo.upsert).toHaveBeenCalledTimes(1);
      expect(result.streak.currentStreak).toBe(1);
    });

    it('should throw NotFoundError when devotional not found', async () => {
      mockDevotionalRepo.findById!.mockResolvedValue(null);

      await expect(service.completeDevotional('nonexistent', 'user-1')).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when already completed', async () => {
      const devotional = createDevotional();
      mockDevotionalRepo.findById!.mockResolvedValue(devotional);
      mockCompletionRepo.findByUserAndDevotional!.mockResolvedValue({
        id: 'existing',
        userId: 'user-1',
        devotionalId: devotional.id,
        completedAt: new Date(),
      });

      await expect(service.completeDevotional(devotional.id, 'user-1')).rejects.toThrow(ConflictError);
    });
  });

  describe('createDevotional', () => {
    it('should create and return a devotional', async () => {
      const devotional = createDevotional();
      mockDevotionalRepo.create!.mockResolvedValue(devotional);

      const result = await service.createDevotional({
        title: 'Test Devotional',
        scriptureReference: 'John 3:16',
        scriptureText: 'For God so loved the world...',
        reflection: 'A reflection.',
        closingPrayer: 'Amen.',
        publishedDate: new Date('2026-06-20'),
      });

      expect(result.title).toBe('Test Devotional');
      expect(mockDevotionalRepo.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateDevotional', () => {
    it('should update and return devotional', async () => {
      const devotional = createDevotional();
      mockDevotionalRepo.findById!.mockResolvedValue(devotional);
      mockDevotionalRepo.update!.mockResolvedValue(devotional);

      const result = await service.updateDevotional(devotional.id, {
        title: 'Updated Title',
      });

      expect(result.title).toBe('Test Devotional');
    });

    it('should throw NotFoundError when devotional not found', async () => {
      mockDevotionalRepo.findById!.mockResolvedValue(null);

      await expect(service.updateDevotional('nonexistent', { title: 'New Title' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteDevotional', () => {
    it('should delete devotional', async () => {
      mockDevotionalRepo.delete!.mockResolvedValue(undefined);

      await service.deleteDevotional('some-id');

      expect(mockDevotionalRepo.delete).toHaveBeenCalledWith('some-id');
    });
  });
});
