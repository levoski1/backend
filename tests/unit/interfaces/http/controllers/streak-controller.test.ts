import request from 'supertest';
import jwt from 'jsonwebtoken';

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

jest.mock('@infrastructure/database/repositories/streak-repository', () => ({
  StreakRepository: jest.fn().mockImplementation(() => mockStreakRepoMethods),
}));

const validUserId = '223e4567-e89b-12d3-a456-426614174001';

import app from '@/app';

function setAuthToken(userId = validUserId, role = 'user') {
  const jwtVerify = jwt.verify as jest.Mock;
  jwtVerify.mockReturnValue({ sub: userId, role });
}

describe('StreakController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStreakRepoMethods.findByUser = jest.fn();
    mockStreakRepoMethods.findByUserAndDiscipline = jest.fn();
  });

  describe('GET /api/v1/streaks/me', () => {
    it('should return 200 with streak data for all disciplines', async () => {
      setAuthToken();
      mockStreakRepoMethods.findByUser!.mockResolvedValue([
        {
          id: 'streak-1',
          userId: validUserId,
          disciplineType: 'devotional',
          currentStreak: 5,
          longestStreak: 10,
          lastCompletedDate: new Date('2026-06-19'),
          graceDayUsed: false,
          graceDayWeekStart: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const response = await request(app)
        .get('/api/v1/streaks/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.streaks).toHaveLength(3);
      const devotional = response.body.data.streaks.find((s: { disciplineType: string }) => s.disciplineType === 'devotional');
      expect(devotional.currentStreak).toBe(5);
      expect(devotional.longestStreak).toBe(10);
    });

    it('should return 200 with empty streaks for new users', async () => {
      setAuthToken();
      mockStreakRepoMethods.findByUser!.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/streaks/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data.streaks).toHaveLength(3);
      response.body.data.streaks.forEach((s: { currentStreak: number }) => {
        expect(s.currentStreak).toBe(0);
      });
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/streaks/me');

      expect(response.status).toBe(401);
    });
  });
});
