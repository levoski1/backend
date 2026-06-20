import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Profile, User, Email, PasswordHash, AccountStatus, AuthProvider, PrivacySettings } from '@domain/index';

const mockProfileRepoMethods: Record<string, jest.Mock | undefined> = {
  findByUserId: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  getNotificationSettings: jest.fn(),
  updateNotificationSettings: jest.fn(),
  deleteByUserId: jest.fn(),
};

const mockUserRepoMethods: Record<string, jest.Mock | undefined> = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateLastLogin: jest.fn(),
};

const mockStorageMethods: Record<string, jest.Mock | undefined> = {
  uploadProfilePhoto: jest.fn(),
  deletePhoto: jest.fn(),
};

jest.mock('express-rate-limit', () => jest.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(),
}));

jest.mock('@infrastructure/database/repositories/profile-repository', () => ({
  ProfileRepository: jest.fn().mockImplementation(() => mockProfileRepoMethods),
}));

jest.mock('@infrastructure/database/repositories/user-repository', () => ({
  UserRepository: jest.fn().mockImplementation(() => mockUserRepoMethods),
}));

jest.mock('@infrastructure/storage/supabase-storage', () => ({
  SupabaseStorage: jest.fn().mockImplementation(() => mockStorageMethods),
}));

const validUserId = '123e4567-e89b-12d3-a456-426614174000';
const validProfileId = '223e4567-e89b-12d3-a456-426614174001';

const validUser = new User({
  id: validUserId,
  fullName: 'John Doe',
  email: Email.create('john@example.com'),
  passwordHash: PasswordHash.create('$2b$12$LJ3m4ys3Lk5x7D8k9n0Ae.1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z'),
  accountStatus: AccountStatus.ACTIVE,
  authProvider: AuthProvider.EMAIL,
  emailVerified: true,
  privacySettings: PrivacySettings.defaults(),
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
});

const validProfile = new Profile({
  id: validProfileId,
  userId: validUserId,
  displayName: 'John Doe',
  bio: 'Walking in faith.',
  avatarUrl: 'https://example.com/avatar.jpg',
  denomination: 'Non-denominational',
  spiritualInterests: ['prayer', 'bible-study'],
  timezone: 'America/New_York',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
});

import app from '@/app';

function setAuthToken(userId = validUserId) {
  const jwtVerify = jwt.verify as jest.Mock;
  jwtVerify.mockReturnValue({ sub: userId, role: 'user' });
}

describe('ProfileController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProfileRepoMethods.findByUserId = jest.fn();
    mockProfileRepoMethods.findById = jest.fn();
    mockProfileRepoMethods.create = jest.fn();
    mockProfileRepoMethods.update = jest.fn();
    mockProfileRepoMethods.getNotificationSettings = jest.fn();
    mockProfileRepoMethods.updateNotificationSettings = jest.fn();
    mockUserRepoMethods.findById = jest.fn();
    mockUserRepoMethods.update = jest.fn();
    mockStorageMethods.uploadProfilePhoto = jest.fn();
    mockStorageMethods.deletePhoto = jest.fn();
  });

  describe('GET /api/v1/profile/:userId', () => {
    it('should return 200 with public profile', async () => {
      mockUserRepoMethods.findById!.mockResolvedValue(validUser);
      mockProfileRepoMethods.findByUserId!.mockResolvedValue(validProfile);

      const response = await request(app)
        .get(`/api/v1/profile/${validUserId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.profile.displayName).toBe('John Doe');
    });

    it('should return 404 when user not found', async () => {
      mockUserRepoMethods.findById!.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/v1/profile/${validUserId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 when profile is private', async () => {
      const privateUser = new User({
        ...validUser.toParams(),
        privacySettings: new PrivacySettings({ profileVisibility: 'private', showFaithInfo: true }),
      });
      mockUserRepoMethods.findById!.mockResolvedValue(privateUser);

      const response = await request(app)
        .get(`/api/v1/profile/${validUserId}`);

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid userId format', async () => {
      const response = await request(app)
        .get('/api/v1/profile/not-a-uuid');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/profile/me', () => {
    it('should return 200 with full profile when authenticated', async () => {
      setAuthToken();
      mockUserRepoMethods.findById!.mockResolvedValue(validUser);
      mockProfileRepoMethods.findByUserId!.mockResolvedValue(validProfile);

      const response = await request(app)
        .get('/api/v1/profile/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.profile.displayName).toBe('John Doe');
      expect(response.body.data.profile.email).toBe('john@example.com');
      expect(response.body.data.profile.fullName).toBe('John Doe');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/profile/me');

      expect(response.status).toBe(401);
    });

    it('should return 404 when user not found', async () => {
      setAuthToken();
      mockUserRepoMethods.findById!.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/profile/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/v1/profile/me', () => {
    it('should return 200 when updating profile', async () => {
      setAuthToken();
      mockUserRepoMethods.findById!.mockResolvedValue(validUser);
      mockProfileRepoMethods.findByUserId!.mockResolvedValue(validProfile);
      const updatedProfile = validProfile.update({ displayName: 'New Name' });
      mockProfileRepoMethods.update!.mockResolvedValue(updatedProfile);

      const response = await request(app)
        .put('/api/v1/profile/me')
        .set('Authorization', 'Bearer valid-token')
        .send({ displayName: 'New Name' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.profile.displayName).toBe('New Name');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .put('/api/v1/profile/me')
        .send({ displayName: 'New Name' });

      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid displayName', async () => {
      setAuthToken();
      mockUserRepoMethods.findById!.mockResolvedValue(validUser);

      const response = await request(app)
        .put('/api/v1/profile/me')
        .set('Authorization', 'Bearer valid-token')
        .send({ displayName: 'A' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/v1/profile/me/privacy', () => {
    it('should return 200 when updating privacy settings', async () => {
      setAuthToken();
      mockUserRepoMethods.findById!.mockResolvedValue(validUser);
      mockUserRepoMethods.update!.mockResolvedValue(validUser);

      const response = await request(app)
        .put('/api/v1/profile/me/privacy')
        .set('Authorization', 'Bearer valid-token')
        .send({ profileVisibility: 'private', anonymousPosting: true });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.privacySettings.profileVisibility).toBe('private');
      expect(response.body.data.privacySettings.anonymousPosting).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .put('/api/v1/profile/me/privacy')
        .send({ profileVisibility: 'private' });

      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid profileVisibility', async () => {
      setAuthToken();

      const response = await request(app)
        .put('/api/v1/profile/me/privacy')
        .set('Authorization', 'Bearer valid-token')
        .send({ profileVisibility: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/v1/profile/me/settings', () => {
    it('should return 200 when updating settings', async () => {
      setAuthToken();
      mockUserRepoMethods.findById!.mockResolvedValue(validUser);
      mockProfileRepoMethods.getNotificationSettings!.mockResolvedValue({
        prayerReminders: true,
        communityUpdates: true,
        streakAlerts: true,
      });

      const response = await request(app)
        .put('/api/v1/profile/me/settings')
        .set('Authorization', 'Bearer valid-token')
        .send({ prayerReminders: false });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.settings.prayerReminders).toBe(false);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .put('/api/v1/profile/me/settings')
        .send({ prayerReminders: false });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/profile/me', () => {
    it('should return 200 when deleting account', async () => {
      setAuthToken();
      mockUserRepoMethods.findById!.mockResolvedValue(validUser);

      const response = await request(app)
        .delete('/api/v1/profile/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .delete('/api/v1/profile/me');

      expect(response.status).toBe(401);
    });

    it('should return 404 when user not found', async () => {
      setAuthToken();
      mockUserRepoMethods.findById!.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/v1/profile/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
    });
  });
});
