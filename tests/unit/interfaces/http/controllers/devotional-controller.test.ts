import request from 'supertest';
import jwt from 'jsonwebtoken';

const mockDevotionalRepoMethods: Record<string, jest.Mock | undefined> = {
  findToday: jest.fn(),
  findByDate: jest.fn(),
  findArchive: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockCompletionRepoMethods: Record<string, jest.Mock | undefined> = {
  findByUserAndDevotional: jest.fn(),
  findByUserAndDevotionalIds: jest.fn(),
  create: jest.fn(),
};

const mockStreakRepoMethods: Record<string, jest.Mock | undefined> = {
  findByUserAndDiscipline: jest.fn(),
  findByUser: jest.fn(),
  upsert: jest.fn(),
};

jest.mock('express-rate-limit', () => jest.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(),
}));

jest.mock('@infrastructure/database/repositories/devotional-repository', () => ({
  DevotionalRepository: jest.fn().mockImplementation(() => mockDevotionalRepoMethods),
}));

jest.mock('@infrastructure/database/repositories/devotional-completion-repository', () => ({
  DevotionalCompletionRepository: jest.fn().mockImplementation(() => mockCompletionRepoMethods),
}));

jest.mock('@infrastructure/database/repositories/streak-repository', () => ({
  StreakRepository: jest.fn().mockImplementation(() => mockStreakRepoMethods),
}));

const validDevotionalId = '123e4567-e89b-12d3-a456-426614174000';
const validUserId = '223e4567-e89b-12d3-a456-426614174001';

import app from '@/app';

function setAuthToken(userId = validUserId, role = 'user') {
  const jwtVerify = jwt.verify as jest.Mock;
  jwtVerify.mockReturnValue({ sub: userId, role });
}

function clearAuthToken() {
  const jwtVerify = jwt.verify as jest.Mock;
  jwtVerify.mockReset();
}

describe('DevotionalController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDevotionalRepoMethods.findToday = jest.fn();
    mockDevotionalRepoMethods.findByDate = jest.fn();
    mockDevotionalRepoMethods.findArchive = jest.fn();
    mockDevotionalRepoMethods.findById = jest.fn();
    mockDevotionalRepoMethods.create = jest.fn();
    mockDevotionalRepoMethods.update = jest.fn();
    mockDevotionalRepoMethods.delete = jest.fn();
    mockCompletionRepoMethods.findByUserAndDevotional = jest.fn();
    mockCompletionRepoMethods.findByUserAndDevotionalIds = jest.fn();
    mockCompletionRepoMethods.create = jest.fn();
    mockStreakRepoMethods.findByUserAndDiscipline = jest.fn();
    mockStreakRepoMethods.findByUser = jest.fn();
    mockStreakRepoMethods.upsert = jest.fn();
  });

  describe('GET /api/v1/devotionals/today', () => {
    it('should return 200 with today\'s devotional', async () => {
      mockDevotionalRepoMethods.findToday!.mockResolvedValue({
        id: validDevotionalId,
        title: 'Today\'s Devotional',
        scriptureReference: 'John 3:16',
        scriptureText: 'For God so loved the world...',
        reflection: 'A reflection.',
        closingPrayer: 'Amen.',
        publishedDate: new Date('2026-06-20'),
        author: 'Test Author',
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .get('/api/v1/devotionals/today');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.devotional.title).toBe('Today\'s Devotional');
    });

    it('should return 404 when no devotional available', async () => {
      mockDevotionalRepoMethods.findToday!.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/devotionals/today');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/devotionals/:identifier', () => {
    it('should return 200 for valid date', async () => {
      mockDevotionalRepoMethods.findByDate!.mockResolvedValue({
        id: validDevotionalId,
        title: 'Devotional by Date',
        scriptureReference: 'John 3:16',
        scriptureText: 'For God so loved the world...',
        reflection: 'A reflection.',
        closingPrayer: 'Amen.',
        publishedDate: new Date('2026-06-20'),
        author: 'Test Author',
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .get('/api/v1/devotionals/2026-06-20');

      expect(response.status).toBe(200);
      expect(response.body.data.devotional.title).toBe('Devotional by Date');
    });

    it('should return 200 for valid UUID', async () => {
      mockDevotionalRepoMethods.findById!.mockResolvedValue({
        id: validDevotionalId,
        title: 'Devotional by ID',
        scriptureReference: 'John 3:16',
        scriptureText: 'For God so loved the world...',
        reflection: 'A reflection.',
        closingPrayer: 'Amen.',
        publishedDate: new Date('2026-06-20'),
        author: 'Test Author',
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .get(`/api/v1/devotionals/${validDevotionalId}`);

      expect(response.status).toBe(200);
      expect(response.body.data.devotional.title).toBe('Devotional by ID');
    });

    it('should return 400 for invalid identifier format', async () => {
      const response = await request(app)
        .get('/api/v1/devotionals/not-valid');

      expect(response.status).toBe(400);
    });

    it('should return 404 when date not found', async () => {
      mockDevotionalRepoMethods.findByDate!.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/devotionals/2026-06-20');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/devotionals/archive', () => {
    it('should return 200 with archive items', async () => {
      mockDevotionalRepoMethods.findArchive!.mockResolvedValue([
        {
          id: validDevotionalId,
          title: 'Archive Item',
          scripture_reference: 'John 3:16',
          published_date: '2026-06-20',
          author: 'Test Author',
        },
      ]);

      const response = await request(app)
        .get('/api/v1/devotionals/archive');

      expect(response.status).toBe(200);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].title).toBe('Archive Item');
    });
  });

  describe('POST /api/v1/devotionals/:devotionalId/complete', () => {
    it('should return 200 when completing a devotional', async () => {
      setAuthToken();
      mockDevotionalRepoMethods.findById!.mockResolvedValue({
        id: validDevotionalId,
        title: 'Devotional',
        scriptureReference: 'John 3:16',
        scriptureText: 'For God so loved the world...',
        reflection: 'A reflection.',
        closingPrayer: 'Amen.',
        publishedDate: new Date('2026-06-20'),
        author: 'Test Author',
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockCompletionRepoMethods.findByUserAndDevotional!.mockResolvedValue(null);
      mockCompletionRepoMethods.create!.mockResolvedValue({});
      mockStreakRepoMethods.findByUserAndDiscipline!.mockResolvedValue(null);
      mockStreakRepoMethods.upsert!.mockResolvedValue({
        id: 'streak-id',
        userId: validUserId,
        disciplineType: 'devotional',
        currentStreak: 1,
        longestStreak: 1,
        lastCompletedDate: new Date(),
        graceDayUsed: false,
      });

      const response = await request(app)
        .post(`/api/v1/devotionals/${validDevotionalId}/complete`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.streak.currentStreak).toBe(1);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post(`/api/v1/devotionals/${validDevotionalId}/complete`);

      expect(response.status).toBe(401);
    });

    it('should return 404 when devotional not found', async () => {
      setAuthToken();
      mockDevotionalRepoMethods.findById!.mockResolvedValue(null);

      const response = await request(app)
        .post(`/api/v1/devotionals/${validDevotionalId}/complete`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
    });

    it('should return 409 when already completed', async () => {
      setAuthToken();
      mockDevotionalRepoMethods.findById!.mockResolvedValue({
        id: validDevotionalId,
        title: 'Devotional',
        scriptureReference: 'John 3:16',
        scriptureText: 'For God so loved the world...',
        reflection: 'A reflection.',
        closingPrayer: 'Amen.',
        publishedDate: new Date('2026-06-20'),
        author: 'Test Author',
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockCompletionRepoMethods.findByUserAndDevotional!.mockResolvedValue({
        id: 'existing',
        userId: validUserId,
        devotionalId: validDevotionalId,
        completedAt: new Date(),
      });

      const response = await request(app)
        .post(`/api/v1/devotionals/${validDevotionalId}/complete`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(409);
    });
  });
});
