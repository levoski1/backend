import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthService } from '@application/auth/auth-service';
import type { UserRepository } from '@infrastructure/database/repositories/user-repository';
import type { RefreshTokenRepository } from '@infrastructure/database/repositories/refresh-token-repository';
import { User, Email, PasswordHash, AccountStatus, AuthProvider, PrivacySettings } from '@domain/index';
import { ConflictError, AuthenticationError } from '@shared/errors';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(),
}));

const mockBcryptHash = bcrypt.hash as jest.Mock;
const mockBcryptCompare = bcrypt.compare as jest.Mock;

const mockUserRepo = {
  findByEmail: jest.fn(),
  create: jest.fn(),
  updateLastLogin: jest.fn(),
  findById: jest.fn(),
};

const mockRefreshTokenRepo = {
  create: jest.fn(),
  findByTokenHash: jest.fn(),
  revoke: jest.fn(),
  revokeFamily: jest.fn(),
  revokeAllForUser: jest.fn(),
};

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

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService(
      mockUserRepo as unknown as UserRepository,
      mockRefreshTokenRepo as unknown as RefreshTokenRepository,
    );
  });

  describe('register', () => {
    it('should hash the password, create a new user, and return tokens', async () => {
      mockBcryptHash.mockResolvedValue('$2b$12$mockedhash');
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.create.mockImplementation(async (user: User) => user);

      const result = await authService.register({
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBe('mock-jwt-token');
      expect(result.tokens.refreshToken).toBe('mock-jwt-token');
      expect(result.user.fullName).toBe('John Doe');
      expect(result.user.email.getValue()).toBe('john@example.com');
      expect(result.user.authProvider).toBe(AuthProvider.EMAIL);
      expect(result.user.emailVerified).toBe(true);
      expect(mockBcryptHash).toHaveBeenCalledWith('password123', expect.any(Number));
      expect(mockUserRepo.create).toHaveBeenCalledTimes(1);
      expect(mockRefreshTokenRepo.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictError when email is already taken', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(validUser);

      await expect(
        authService.register({
          fullName: 'Jane Doe',
          email: 'john@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictError);

      expect(mockUserRepo.create).not.toHaveBeenCalled();
    });

    it('should not create user when email already exists', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(validUser);

      try {
        await authService.register({
          fullName: 'Jane Doe',
          email: 'john@example.com',
          password: 'password123',
        });
      } catch {
        // expected
      }

      expect(mockUserRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return user and tokens on valid email and password', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(validUser);
      mockBcryptCompare.mockResolvedValue(true);

      const result = await authService.login('john@example.com', 'password123');

      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBe('mock-jwt-token');
      expect(result.tokens.refreshToken).toBe('mock-jwt-token');
      expect(result.user.id).toBe(validUser.id);
      expect(result.user.fullName).toBe('John Doe');
      expect(result.user.email.getValue()).toBe('john@example.com');
      expect(mockUserRepo.updateLastLogin).toHaveBeenCalledWith(validUser.id);
      expect(mockRefreshTokenRepo.create).toHaveBeenCalledTimes(1);
    });

    it('should throw AuthenticationError when email is not found', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login('unknown@example.com', 'password123'),
      ).rejects.toThrow(AuthenticationError);

      expect(mockUserRepo.updateLastLogin).not.toHaveBeenCalled();
    });

    it('should throw AuthenticationError when password is incorrect', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(validUser);
      mockBcryptCompare.mockResolvedValue(false);

      await expect(
        authService.login('john@example.com', 'wrongpassword'),
      ).rejects.toThrow(AuthenticationError);

      expect(mockUserRepo.updateLastLogin).not.toHaveBeenCalled();
    });

    it('should throw AuthenticationError when account is not active', async () => {
      const suspendedUser = new User({
        ...validUser.toParams(),
        accountStatus: AccountStatus.SUSPENDED,
      });
      mockUserRepo.findByEmail.mockResolvedValue(suspendedUser);
      mockBcryptCompare.mockResolvedValue(true);

      await expect(
        authService.login('john@example.com', 'password123'),
      ).rejects.toThrow(AuthenticationError);

      expect(mockUserRepo.updateLastLogin).not.toHaveBeenCalled();
    });

    it('should not reveal whether email exists or password is wrong', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);

      const notFoundError = await authService
        .login('nonexistent@example.com', 'anything')
        .catch((e: Error) => e);

      mockUserRepo.findByEmail.mockResolvedValue(validUser);
      mockBcryptCompare.mockResolvedValue(false);

      const wrongPasswordError = await authService
        .login('john@example.com', 'wrongpassword')
        .catch((e: Error) => e);

      expect(notFoundError.message).toBe(wrongPasswordError.message);
    });
  });

  describe('refresh', () => {
    it('should return new tokens for a valid refresh token', async () => {
      const jwtVerify = jwt.verify as jest.Mock;
      jwtVerify.mockReturnValue({ sub: validUser.id, jti: 'token-jti' });

      mockRefreshTokenRepo.findByTokenHash.mockResolvedValue({
        id: 'rt-id',
        user_id: validUser.id,
        token_hash: 'hash',
        family_id: 'family-id',
        expires_at: new Date(Date.now() + 86400000),
        revoked_at: null,
        created_at: new Date(),
      });
      mockUserRepo.findById.mockResolvedValue(validUser);

      const result = await authService.refresh('valid-refresh-token');

      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBe('mock-jwt-token');
      expect(result.tokens.refreshToken).toBe('mock-jwt-token');
      expect(result.user.id).toBe(validUser.id);
    });

    it('should revoke token family on reuse of revoked token', async () => {
      const jwtVerify = jwt.verify as jest.Mock;
      jwtVerify.mockReturnValue({ sub: validUser.id, jti: 'token-jti' });

      mockRefreshTokenRepo.findByTokenHash.mockResolvedValue({
        id: 'rt-id',
        user_id: validUser.id,
        token_hash: 'hash',
        family_id: 'family-id',
        expires_at: new Date(Date.now() + 86400000),
        revoked_at: new Date(),
        created_at: new Date(),
      });

      await expect(
        authService.refresh('revoked-token'),
      ).rejects.toThrow(AuthenticationError);

      expect(mockRefreshTokenRepo.revokeFamily).toHaveBeenCalledWith('family-id');
    });

    it('should throw on expired refresh token', async () => {
      const jwtVerify = jwt.verify as jest.Mock;
      jwtVerify.mockReturnValue({ sub: validUser.id, jti: 'token-jti' });

      mockRefreshTokenRepo.findByTokenHash.mockResolvedValue({
        id: 'rt-id',
        user_id: validUser.id,
        token_hash: 'hash',
        family_id: 'family-id',
        expires_at: new Date(Date.now() - 86400000),
        revoked_at: null,
        created_at: new Date(),
      });

      await expect(
        authService.refresh('expired-token'),
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw on invalid JWT', async () => {
      const jwtVerify = jwt.verify as jest.Mock;
      jwtVerify.mockImplementation(() => { throw new Error('invalid'); });

      await expect(
        authService.refresh('bad-token'),
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe('logout', () => {
    it('should revoke the refresh token', async () => {
      await authService.logout('some-refresh-token');
      expect(mockRefreshTokenRepo.revoke).toHaveBeenCalledTimes(1);
    });
  });
});
