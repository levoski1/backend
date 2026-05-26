import bcrypt from 'bcrypt';
import { AuthService } from '@application/auth/auth-service';
import type { UserRepository } from '@infrastructure/database/repositories/user-repository';
import { User, Email, PasswordHash, AccountStatus, AuthProvider, PrivacySettings } from '@domain/index';
import { ConflictError, AuthenticationError } from '@shared/errors';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const mockBcryptHash = bcrypt.hash as jest.Mock;
const mockBcryptCompare = bcrypt.compare as jest.Mock;

const mockRepo = {
  findByEmail: jest.fn(),
  create: jest.fn(),
  updateLastLogin: jest.fn(),
  findById: jest.fn(),
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
    authService = new AuthService(mockRepo as unknown as UserRepository);
  });

  describe('register', () => {
    it('should hash the password and create a new user', async () => {
      mockBcryptHash.mockResolvedValue('$2b$12$mockedhash');
      mockRepo.findByEmail.mockResolvedValue(null);
      mockRepo.create.mockImplementation(async (user: User) => user);

      const result = await authService.register({
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      expect(result.user).toBeDefined();
      expect(result.user.fullName).toBe('John Doe');
      expect(result.user.email.getValue()).toBe('john@example.com');
      expect(result.user.authProvider).toBe(AuthProvider.EMAIL);
      expect(result.user.emailVerified).toBe(true);
      expect(mockBcryptHash).toHaveBeenCalledWith('password123', expect.any(Number));
      expect(mockRepo.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictError when email is already taken', async () => {
      mockRepo.findByEmail.mockResolvedValue(validUser);

      await expect(
        authService.register({
          fullName: 'Jane Doe',
          email: 'john@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictError);

      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('should not create user when email already exists', async () => {
      mockRepo.findByEmail.mockResolvedValue(validUser);

      try {
        await authService.register({
          fullName: 'Jane Doe',
          email: 'john@example.com',
          password: 'password123',
        });
      } catch {
        // expected
      }

      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return user on valid email and password', async () => {
      mockRepo.findByEmail.mockResolvedValue(validUser);
      mockBcryptCompare.mockResolvedValue(true);

      const result = await authService.login('john@example.com', 'password123');

      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(validUser.id);
      expect(result.user.fullName).toBe('John Doe');
      expect(result.user.email.getValue()).toBe('john@example.com');
      expect(mockRepo.updateLastLogin).toHaveBeenCalledWith(validUser.id);
    });

    it('should throw AuthenticationError when email is not found', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login('unknown@example.com', 'password123'),
      ).rejects.toThrow(AuthenticationError);

      expect(mockRepo.updateLastLogin).not.toHaveBeenCalled();
    });

    it('should throw AuthenticationError when password is incorrect', async () => {
      mockRepo.findByEmail.mockResolvedValue(validUser);
      mockBcryptCompare.mockResolvedValue(false);

      await expect(
        authService.login('john@example.com', 'wrongpassword'),
      ).rejects.toThrow(AuthenticationError);

      expect(mockRepo.updateLastLogin).not.toHaveBeenCalled();
    });

    it('should throw AuthenticationError when account is not active', async () => {
      const suspendedUser = new User({
        ...validUser.toParams(),
        accountStatus: AccountStatus.SUSPENDED,
      });
      mockRepo.findByEmail.mockResolvedValue(suspendedUser);
      mockBcryptCompare.mockResolvedValue(true);

      await expect(
        authService.login('john@example.com', 'password123'),
      ).rejects.toThrow(AuthenticationError);

      expect(mockRepo.updateLastLogin).not.toHaveBeenCalled();
    });

    it('should not reveal whether email exists or password is wrong', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);

      const notFoundError = await authService
        .login('nonexistent@example.com', 'anything')
        .catch((e: Error) => e);

      mockRepo.findByEmail.mockResolvedValue(validUser);
      mockBcryptCompare.mockResolvedValue(false);

      const wrongPasswordError = await authService
        .login('john@example.com', 'wrongpassword')
        .catch((e: Error) => e);

      expect(notFoundError.message).toBe(wrongPasswordError.message);
    });
  });
});
