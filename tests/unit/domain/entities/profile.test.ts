import { Profile } from '@domain/index';

function makeValidProfileParams(overrides: Record<string, unknown> = {}) {
  return {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: '223e4567-e89b-12d3-a456-426614174001',
    displayName: 'GraceWilson',
    bio: 'Finding strength in scripture and community.',
    avatarUrl: 'https://example.com/avatar.jpg',
    denomination: 'Non-denominational',
    spiritualInterests: ['prayer', 'bible-study'],
    timezone: 'America/New_York',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('Profile Entity', () => {
  describe('constructor', () => {
    it('should create a profile with all required fields', () => {
      const params = makeValidProfileParams();
      const profile = new Profile(params);
      expect(profile.id).toBe(params.id);
      expect(profile.userId).toBe(params.userId);
      expect(profile.displayName).toBe('GraceWilson');
      expect(profile.bio).toBe('Finding strength in scripture and community.');
      expect(profile.avatarUrl).toBe('https://example.com/avatar.jpg');
      expect(profile.denomination).toBe('Non-denominational');
      expect(profile.spiritualInterests).toEqual(['prayer', 'bible-study']);
      expect(profile.timezone).toBe('America/New_York');
      expect(profile.createdAt).toEqual(new Date('2026-01-01'));
      expect(profile.updatedAt).toEqual(new Date('2026-01-01'));
    });

    it('should default timezone to UTC when not provided', () => {
      const params = makeValidProfileParams({ timezone: undefined });
      const profile = new Profile(params);
      expect(profile.timezone).toBe('UTC');
    });

    it('should default spiritualInterests to empty array when not provided', () => {
      const params = makeValidProfileParams({ spiritualInterests: undefined });
      const profile = new Profile(params);
      expect(profile.spiritualInterests).toEqual([]);
    });

    it('should reject invalid profile ID', () => {
      const params = makeValidProfileParams({ id: 'not-a-uuid' });
      expect(() => new Profile(params)).toThrow('Profile ID must be a valid UUID');
    });

    it('should reject empty profile ID', () => {
      const params = makeValidProfileParams({ id: '' });
      expect(() => new Profile(params)).toThrow('Profile ID is required');
    });

    it('should reject invalid user ID', () => {
      const params = makeValidProfileParams({ userId: 'not-a-uuid' });
      expect(() => new Profile(params)).toThrow('User ID must be a valid UUID');
    });

    it('should reject empty user ID', () => {
      const params = makeValidProfileParams({ userId: '' });
      expect(() => new Profile(params)).toThrow('User ID is required');
    });

    it('should reject empty display name', () => {
      const params = makeValidProfileParams({ displayName: '' });
      expect(() => new Profile(params)).toThrow('Display name is required');
    });

    it('should reject display name shorter than 2 characters', () => {
      const params = makeValidProfileParams({ displayName: 'A' });
      expect(() => new Profile(params)).toThrow('at least 2 characters');
    });

    it('should reject display name over 50 characters', () => {
      const params = makeValidProfileParams({ displayName: 'A'.repeat(51) });
      expect(() => new Profile(params)).toThrow('not exceed 50 characters');
    });

    it('should trim display name', () => {
      const params = makeValidProfileParams({ displayName: '  GraceWilson  ' });
      const profile = new Profile(params);
      expect(profile.displayName).toBe('GraceWilson');
    });
  });

  describe('static create', () => {
    it('should create a profile with sensible timestamps', () => {
      const profile = Profile.create({
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '223e4567-e89b-12d3-a456-426614174001',
        displayName: 'GraceWilson',
      });

      expect(profile.displayName).toBe('GraceWilson');
      expect(profile.timezone).toBe('UTC');
      expect(profile.spiritualInterests).toEqual([]);
      expect(profile.createdAt).toBeInstanceOf(Date);
      expect(profile.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('update', () => {
    it('should update displayName', () => {
      const profile = new Profile(makeValidProfileParams());
      const updated = profile.update({ displayName: 'NewName' });
      expect(updated.displayName).toBe('NewName');
    });

    it('should update bio', () => {
      const profile = new Profile(makeValidProfileParams());
      const updated = profile.update({ bio: 'New bio' });
      expect(updated.bio).toBe('New bio');
    });

    it('should clear bio when set to empty string', () => {
      const profile = new Profile(makeValidProfileParams());
      const updated = profile.update({ bio: '' });
      expect(updated.bio).toBe('');
    });

    it('should update denomination', () => {
      const profile = new Profile(makeValidProfileParams());
      const updated = profile.update({ denomination: 'Catholic' });
      expect(updated.denomination).toBe('Catholic');
    });

    it('should update spiritualInterests', () => {
      const profile = new Profile(makeValidProfileParams());
      const updated = profile.update({ spiritualInterests: ['worship', 'missions'] });
      expect(updated.spiritualInterests).toEqual(['worship', 'missions']);
    });

    it('should update timezone', () => {
      const profile = new Profile(makeValidProfileParams());
      const updated = profile.update({ timezone: 'Europe/London' });
      expect(updated.timezone).toBe('Europe/London');
    });

    it('should return a new instance', () => {
      const profile = new Profile(makeValidProfileParams());
      const updated = profile.update({ displayName: 'NewName' });
      expect(updated).not.toBe(profile);
    });

    it('should update the updatedAt timestamp', () => {
      const profile = new Profile(makeValidProfileParams());
      const updated = profile.update({ displayName: 'NewName' });
      expect(updated.updatedAt.getTime()).toBeGreaterThan(profile.updatedAt.getTime());
    });

    it('should preserve fields not being updated', () => {
      const params = makeValidProfileParams();
      const profile = new Profile(params);
      const updated = profile.update({ displayName: 'NewName' });
      expect(updated.bio).toBe(params.bio);
      expect(updated.denomination).toBe(params.denomination);
      expect(updated.timezone).toBe(params.timezone);
    });

    it('should reject invalid display name on update', () => {
      const profile = new Profile(makeValidProfileParams());
      expect(() => profile.update({ displayName: 'A' })).toThrow('at least 2 characters');
    });
  });

  describe('toPublicProfile', () => {
    it('should return non-sensitive fields only', () => {
      const profile = new Profile(makeValidProfileParams());
      const publicProfile = profile.toPublicProfile();
      expect(publicProfile.displayName).toBe('GraceWilson');
      expect(publicProfile.bio).toBeDefined();
      expect(publicProfile.avatarUrl).toBeDefined();
      expect(publicProfile.denomination).toBeDefined();
      expect(publicProfile.spiritualInterests).toBeDefined();
      expect(publicProfile.timezone).toBeDefined();
      expect((publicProfile as Record<string, unknown>).email).toBeUndefined();
      expect((publicProfile as Record<string, unknown>).fullName).toBeUndefined();
    });
  });

  describe('toFullProfile', () => {
    it('should include user email and fullName', () => {
      const profile = new Profile(makeValidProfileParams());
      const full = profile.toFullProfile('grace@example.com', 'Grace Wilson');
      expect(full.email).toBe('grace@example.com');
      expect(full.fullName).toBe('Grace Wilson');
      expect(full.displayName).toBe('GraceWilson');
    });
  });

  describe('toParams', () => {
    it('should return all fields as a plain object', () => {
      const params = makeValidProfileParams();
      const profile = new Profile(params);
      const result = profile.toParams();
      expect(result.id).toBe(params.id);
      expect(result.userId).toBe(params.userId);
      expect(result.displayName).toBe(params.displayName);
      expect(result.bio).toBe(params.bio);
      expect(result.avatarUrl).toBe(params.avatarUrl);
      expect(result.denomination).toBe(params.denomination);
      expect(result.spiritualInterests).toEqual(params.spiritualInterests);
      expect(result.timezone).toBe(params.timezone);
      expect(result.createdAt).toEqual(params.createdAt);
      expect(result.updatedAt).toEqual(params.updatedAt);
    });
  });
});
