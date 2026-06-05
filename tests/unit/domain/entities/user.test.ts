import {
  User,
  Email,
  PasswordHash,
  PhotoUrl,
  AccountStatus,
  AuthProvider,
  FaithProfile,
  PrivacySettings,
} from '@domain/index';

function makeValidUserParams(overrides: Record<string, unknown> = {}) {
  return {
    id: '123e4567-e89b-12d3-a456-426614174000',
    fullName: 'John Doe',
    email: Email.create('john@example.com'),
    passwordHash: PasswordHash.create('$2b$12$LJ3m4ys3Lk5x7D8k9n0Ae.1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z'),
    accountStatus: AccountStatus.ACTIVE,
    authProvider: AuthProvider.EMAIL,
    emailVerified: false,
    privacySettings: PrivacySettings.defaults(),
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('User Entity', () => {
  describe('constructor', () => {
    it('should create a user with all required fields', () => {
      const params = makeValidUserParams();
      const user = new User(params);
      expect(user.id).toBe(params.id);
      expect(user.fullName).toBe('John Doe');
      expect(user.email.getValue()).toBe('john@example.com');
      expect(user.passwordHash.getValue()).toBe(params.passwordHash.getValue());
      expect(user.accountStatus).toBe(AccountStatus.ACTIVE);
      expect(user.authProvider).toBe(AuthProvider.EMAIL);
      expect(user.emailVerified).toBe(false);
      expect(user.createdAt).toEqual(new Date('2026-01-01'));
      expect(user.updatedAt).toEqual(new Date('2026-01-01'));
    });

    it('should create a user with optional profilePhotoUrl', () => {
      const photo = PhotoUrl.create('https://example.com/photo.jpg');
      const params = makeValidUserParams({ profilePhotoUrl: photo });
      const user = new User(params);
      expect(user.profilePhotoUrl?.getValue()).toBe('https://example.com/photo.jpg');
    });

    it('should create a user with optional faithProfile', () => {
      const faith = new FaithProfile({ denomination: 'Catholic' });
      const params = makeValidUserParams({ faithProfile: faith });
      const user = new User(params);
      expect(user.faithProfile?.denomination).toBe('Catholic');
    });

    it('should create a user with optional phoneNumber', () => {
      const params = makeValidUserParams({ phoneNumber: '+1234567890' });
      const user = new User(params);
      expect(user.phoneNumber).toBe('+1234567890');
    });

    it('should default phoneNumber to undefined when not provided', () => {
      const params = makeValidUserParams();
      const user = new User(params);
      expect(user.phoneNumber).toBeUndefined();
    });

    it('should reject invalid UUID', () => {
      const params = makeValidUserParams({ id: 'not-a-uuid' });
      expect(() => new User(params)).toThrow('User ID must be a valid UUID');
    });

    it('should reject empty ID', () => {
      const params = makeValidUserParams({ id: '' });
      expect(() => new User(params)).toThrow('User ID is required');
    });

    it('should reject empty full name', () => {
      const params = makeValidUserParams({ fullName: '' });
      expect(() => new User(params)).toThrow('Full name is required');
    });

    it('should reject full name shorter than 2 characters', () => {
      const params = makeValidUserParams({ fullName: 'A' });
      expect(() => new User(params)).toThrow('at least 2 characters');
    });

    it('should reject full name over 50 characters', () => {
      const params = makeValidUserParams({ fullName: 'A'.repeat(51) });
      expect(() => new User(params)).toThrow('not exceed 50 characters');
    });

    it('should trim full name', () => {
      const params = makeValidUserParams({ fullName: '  John Doe  ' });
      const user = new User(params);
      expect(user.fullName).toBe('John Doe');
    });

    it('should trim ID', () => {
      const params = makeValidUserParams({ id: '  123e4567-e89b-12d3-a456-426614174000  ' });
      const user = new User(params);
      expect(user.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    });
  });

  describe('static create', () => {
    it('should create a user with sensible defaults', () => {
      const user = User.create({
        id: '123e4567-e89b-12d3-a456-426614174000',
        fullName: 'Jane Doe',
        email: Email.create('jane@example.com'),
        passwordHash: PasswordHash.create('$2b$12$LJ3m4ys3Lk5x7D8k9n0Ae.1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z'),
        authProvider: AuthProvider.GOOGLE,
      });

      expect(user.fullName).toBe('Jane Doe');
      expect(user.authProvider).toBe(AuthProvider.GOOGLE);
      expect(user.accountStatus).toBe(AccountStatus.ACTIVE);
      expect(user.emailVerified).toBe(false);
      expect(user.privacySettings.profileVisibility).toBe('public');
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should accept overrides for defaults', () => {
      const user = User.create({
        id: '123e4567-e89b-12d3-a456-426614174000',
        fullName: 'Jane Doe',
        email: Email.create('jane@example.com'),
        passwordHash: PasswordHash.create('$2b$12$LJ3m4ys3Lk5x7D8k9n0Ae.1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z'),
        authProvider: AuthProvider.EMAIL,
        accountStatus: AccountStatus.SUSPENDED,
        emailVerified: true,
        privacySettings: new PrivacySettings({ profileVisibility: 'private', showFaithInfo: false }),
      });

      expect(user.accountStatus).toBe(AccountStatus.SUSPENDED);
      expect(user.emailVerified).toBe(true);
      expect(user.privacySettings.profileVisibility).toBe('private');
    });
  });

  describe('isActive', () => {
    it('should return true for active users', () => {
      const user = new User(makeValidUserParams({ accountStatus: AccountStatus.ACTIVE }));
      expect(user.isActive()).toBe(true);
    });

    it('should return false for suspended users', () => {
      const user = new User(makeValidUserParams({ accountStatus: AccountStatus.SUSPENDED }));
      expect(user.isActive()).toBe(false);
    });

    it('should return false for banned users', () => {
      const user = new User(makeValidUserParams({ accountStatus: AccountStatus.BANNED }));
      expect(user.isActive()).toBe(false);
    });
  });

  describe('canLogin', () => {
    it('should allow active email user with verified email', () => {
      const user = new User(makeValidUserParams({
        accountStatus: AccountStatus.ACTIVE,
        authProvider: AuthProvider.EMAIL,
        emailVerified: true,
      }));
      expect(user.canLogin()).toBe(true);
    });

    it('should deny active email user without verified email', () => {
      const user = new User(makeValidUserParams({
        accountStatus: AccountStatus.ACTIVE,
        authProvider: AuthProvider.EMAIL,
        emailVerified: false,
      }));
      expect(user.canLogin()).toBe(false);
    });

    it('should allow active Google user without email verification', () => {
      const user = new User(makeValidUserParams({
        accountStatus: AccountStatus.ACTIVE,
        authProvider: AuthProvider.GOOGLE,
        emailVerified: false,
      }));
      expect(user.canLogin()).toBe(true);
    });

    it('should deny suspended users', () => {
      const user = new User(makeValidUserParams({
        accountStatus: AccountStatus.SUSPENDED,
        emailVerified: true,
      }));
      expect(user.canLogin()).toBe(false);
    });

    it('should deny banned users', () => {
      const user = new User(makeValidUserParams({
        accountStatus: AccountStatus.BANNED,
        emailVerified: true,
      }));
      expect(user.canLogin()).toBe(false);
    });
  });

  describe('markEmailVerified', () => {
    it('should set emailVerified to true', () => {
      const user = new User(makeValidUserParams({ emailVerified: false }));
      const updated = user.markEmailVerified();
      expect(updated.emailVerified).toBe(true);
    });

    it('should return a new instance', () => {
      const user = new User(makeValidUserParams());
      const updated = user.markEmailVerified();
      expect(updated).not.toBe(user);
    });

    it('should update the updatedAt timestamp', () => {
      const user = new User(makeValidUserParams());
      const updated = user.markEmailVerified();
      expect(updated.updatedAt.getTime()).toBeGreaterThan(user.updatedAt.getTime());
    });

    it('should preserve other fields', () => {
      const user = new User(makeValidUserParams());
      const updated = user.markEmailVerified();
      expect(updated.id).toBe(user.id);
      expect(updated.fullName).toBe(user.fullName);
      expect(updated.email.getValue()).toBe(user.email.getValue());
    });
  });

  describe('suspend', () => {
    it('should set account status to suspended', () => {
      const user = new User(makeValidUserParams({ accountStatus: AccountStatus.ACTIVE }));
      const updated = user.suspend();
      expect(updated.accountStatus).toBe(AccountStatus.SUSPENDED);
    });

    it('should throw when suspending a banned user', () => {
      const user = new User(makeValidUserParams({ accountStatus: AccountStatus.BANNED }));
      expect(() => user.suspend()).toThrow('Cannot suspend a banned user');
    });

    it('should return a new instance', () => {
      const user = new User(makeValidUserParams());
      const updated = user.suspend();
      expect(updated).not.toBe(user);
    });
  });

  describe('ban', () => {
    it('should set account status to banned', () => {
      const user = new User(makeValidUserParams({ accountStatus: AccountStatus.ACTIVE }));
      const updated = user.ban();
      expect(updated.accountStatus).toBe(AccountStatus.BANNED);
    });

    it('should allow banning a suspended user', () => {
      const user = new User(makeValidUserParams({ accountStatus: AccountStatus.SUSPENDED }));
      const updated = user.ban();
      expect(updated.accountStatus).toBe(AccountStatus.BANNED);
    });
  });

  describe('activate', () => {
    it('should set account status back to active', () => {
      const user = new User(makeValidUserParams({ accountStatus: AccountStatus.SUSPENDED }));
      const updated = user.activate();
      expect(updated.accountStatus).toBe(AccountStatus.ACTIVE);
    });
  });

  describe('updateFaithProfile', () => {
    it('should update the faith profile', () => {
      const user = new User(makeValidUserParams());
      const faith = new FaithProfile({ denomination: 'Protestant' });
      const updated = user.updateFaithProfile(faith);
      expect(updated.faithProfile?.denomination).toBe('Protestant');
    });
  });

  describe('updatePrivacySettings', () => {
    it('should update privacy settings', () => {
      const user = new User(makeValidUserParams());
      const settings = new PrivacySettings({ profileVisibility: 'private', showFaithInfo: false });
      const updated = user.updatePrivacySettings(settings);
      expect(updated.privacySettings.profileVisibility).toBe('private');
      expect(updated.privacySettings.showFaithInfo).toBe(false);
    });
  });

  describe('updatePhotoUrl', () => {
    it('should update the photo URL', () => {
      const user = new User(makeValidUserParams());
      const photo = PhotoUrl.create('https://example.com/new-photo.jpg');
      const updated = user.updatePhotoUrl(photo);
      expect(updated.profilePhotoUrl?.getValue()).toBe('https://example.com/new-photo.jpg');
    });
  });

  describe('removePhotoUrl', () => {
    it('should remove the photo URL', () => {
      const photo = PhotoUrl.create('https://example.com/photo.jpg');
      const user = new User(makeValidUserParams({ profilePhotoUrl: photo }));
      const updated = user.removePhotoUrl();
      expect(updated.profilePhotoUrl).toBeUndefined();
    });
  });

  describe('toParams', () => {
    it('should return all fields as a plain object', () => {
      const params = makeValidUserParams();
      const user = new User(params);
      const result = user.toParams();
      expect(result.id).toBe(params.id);
      expect(result.fullName).toBe(params.fullName);
      expect(result.email).toBe(params.email);
      expect(result.passwordHash).toBe(params.passwordHash);
      expect(result.accountStatus).toBe(params.accountStatus);
      expect(result.authProvider).toBe(params.authProvider);
      expect(result.emailVerified).toBe(params.emailVerified);
      expect(result.privacySettings).toBe(params.privacySettings);
      expect(result.createdAt).toEqual(params.createdAt);
      expect(result.updatedAt).toEqual(params.updatedAt);
    });
  });
});
