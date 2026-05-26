import request from 'supertest';
import bcrypt from 'bcrypt';
import { User, Email, PasswordHash, AccountStatus, AuthProvider, PrivacySettings } from '@domain/index';

const mockBcryptCompare = bcrypt.compare as jest.Mock;
const mockBcryptHash = bcrypt.hash as jest.Mock;

const mockUserRepoMethods: Record<string, jest.Mock | undefined> = {};

jest.mock('express-rate-limit', () => jest.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('@infrastructure/database/repositories/user-repository', () => ({
  UserRepository: jest.fn().mockImplementation(() => mockUserRepoMethods),
}));

const validUser = new User({
  id: '123e4567-e89b-12d3-a456-426614174000',
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

import app from '@/app';

describe('AuthController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRepoMethods.findByEmail = jest.fn();
    mockUserRepoMethods.create = jest.fn();
    mockUserRepoMethods.updateLastLogin = jest.fn();
    mockUserRepoMethods.findById = jest.fn();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return 201', async () => {
      mockBcryptHash.mockResolvedValue('$2b$12$mockedhash');
      mockUserRepoMethods.findByEmail!.mockResolvedValue(null);
      mockUserRepoMethods.create!.mockImplementation(async (user: User) => user);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('john@example.com');
      expect(response.body.data.user.fullName).toBe('John Doe');
      expect(response.body.data.user.id).toBeDefined();
      expect(response.body.meta.requestId).toBeDefined();
    });

    it('should return 409 when email already exists', async () => {
      mockUserRepoMethods.findByEmail!.mockResolvedValue(validUser);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Jane Doe',
          email: 'john@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
      expect(response.body.error.message).toContain('already exists');
    });

    it('should return 400 for missing fullName', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'john@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'John Doe',
          email: 'not-an-email',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for short password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'John Doe',
          email: 'john@example.com',
          password: '1234567',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for short fullName', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'J',
          email: 'john@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully and return 200', async () => {
      mockUserRepoMethods.findByEmail!.mockResolvedValue(validUser);
      mockBcryptCompare.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'john@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('john@example.com');
      expect(response.body.data.user.fullName).toBe('John Doe');
    });

    it('should return 401 for wrong email', async () => {
      mockUserRepoMethods.findByEmail!.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should return 401 for wrong password', async () => {
      mockUserRepoMethods.findByEmail!.mockResolvedValue(validUser);
      mockBcryptCompare.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'john@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should return 401 when account is suspended', async () => {
      const suspendedUser = new User({
        ...validUser.toParams(),
        accountStatus: AccountStatus.SUSPENDED,
      });
      mockUserRepoMethods.findByEmail!.mockResolvedValue(suspendedUser);
      mockBcryptCompare.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'john@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return same error for wrong email and wrong password', async () => {
      mockUserRepoMethods.findByEmail!.mockResolvedValue(null);

      const wrongEmailResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'password123',
        });

      mockUserRepoMethods.findByEmail!.mockResolvedValue(validUser);
      mockBcryptCompare.mockResolvedValue(false);

      const wrongPasswordResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'john@example.com',
          password: 'wrongpassword',
        });

      expect(wrongEmailResponse.body.error.message).toBe(
        wrongPasswordResponse.body.error.message,
      );
    });
  });
});
