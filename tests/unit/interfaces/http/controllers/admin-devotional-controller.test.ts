import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Devotional } from '@domain/index';

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

function makeDevotional(title: string) {
  return new Devotional({
    id: validDevotionalId,
    title,
    scriptureReference: 'John 3:16',
    scriptureText: 'For God so loved the world...',
    reflection: 'A reflection.',
    closingPrayer: 'Amen.',
    publishedDate: new Date('2026-06-20'),
    author: 'Shelter Team',
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function setAuthToken(userId = validUserId, role = 'user') {
  const jwtVerify = jwt.verify as jest.Mock;
  jwtVerify.mockReturnValue({ sub: userId, role });
}

describe('AdminDevotionalController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDevotionalRepoMethods.findById = jest.fn();
    mockDevotionalRepoMethods.create = jest.fn();
    mockDevotionalRepoMethods.update = jest.fn();
    mockDevotionalRepoMethods.delete = jest.fn();
  });

  describe('POST /api/v1/admin/devotionals', () => {
    it('should return 201 when creating as admin', async () => {
      setAuthToken(validUserId, 'admin');
      mockDevotionalRepoMethods.create!.mockResolvedValue({
        id: validDevotionalId,
        title: 'New Devotional',
        scriptureReference: 'John 3:16',
        scriptureText: 'For God so loved the world...',
        reflection: 'A reflection.',
        closingPrayer: 'Amen.',
        publishedDate: new Date('2026-06-20'),
        author: 'Shelter Team',
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .post('/api/v1/admin/devotionals')
        .set('Authorization', 'Bearer admin-token')
        .send({
          title: 'New Devotional',
          scriptureReference: 'John 3:16',
          scriptureText: 'For God so loved the world...',
          reflection: 'A reflection.',
          closingPrayer: 'Amen.',
          publishedDate: '2026-06-20',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.devotional.title).toBe('New Devotional');
    });

    it('should return 403 when user is not admin', async () => {
      setAuthToken(validUserId, 'user');

      const response = await request(app)
        .post('/api/v1/admin/devotionals')
        .set('Authorization', 'Bearer user-token')
        .send({
          title: 'New Devotional',
          scriptureReference: 'John 3:16',
          scriptureText: 'For God so loved the world...',
          reflection: 'A reflection.',
          closingPrayer: 'Amen.',
          publishedDate: '2026-06-20',
        });

      expect(response.status).toBe(403);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/v1/admin/devotionals')
        .send({
          title: 'New Devotional',
          scriptureReference: 'John 3:16',
          scriptureText: 'For God so loved the world...',
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 when required fields are missing', async () => {
      setAuthToken(validUserId, 'admin');

      const response = await request(app)
        .post('/api/v1/admin/devotionals')
        .set('Authorization', 'Bearer admin-token')
        .send({ title: 'Incomplete' });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/v1/admin/devotionals/:devotionalId', () => {
    it('should return 200 when updating as admin', async () => {
      setAuthToken(validUserId, 'admin');
      const original = makeDevotional('Original Title');
      mockDevotionalRepoMethods.findById!.mockResolvedValue(original);
      mockDevotionalRepoMethods.update!.mockResolvedValue(makeDevotional('Updated Title'));

      const response = await request(app)
        .put(`/api/v1/admin/devotionals/${validDevotionalId}`)
        .set('Authorization', 'Bearer admin-token')
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(200);
    });

    it('should return 403 when user is not admin', async () => {
      setAuthToken(validUserId, 'user');

      const response = await request(app)
        .put(`/api/v1/admin/devotionals/${validDevotionalId}`)
        .set('Authorization', 'Bearer user-token')
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(403);
    });

    it('should return 404 when devotional not found', async () => {
      setAuthToken(validUserId, 'admin');
      mockDevotionalRepoMethods.findById!.mockResolvedValue(null);

      const response = await request(app)
        .put(`/api/v1/admin/devotionals/${validDevotionalId}`)
        .set('Authorization', 'Bearer admin-token')
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/admin/devotionals/:devotionalId', () => {
    it('should return 200 when deleting as admin', async () => {
      setAuthToken(validUserId, 'admin');
      mockDevotionalRepoMethods.delete!.mockResolvedValue(undefined);

      const response = await request(app)
        .delete(`/api/v1/admin/devotionals/${validDevotionalId}`)
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeNull();
    });

    it('should return 403 when user is not admin', async () => {
      setAuthToken(validUserId, 'user');

      const response = await request(app)
        .delete(`/api/v1/admin/devotionals/${validDevotionalId}`)
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .delete(`/api/v1/admin/devotionals/${validDevotionalId}`);

      expect(response.status).toBe(401);
    });
  });
});
