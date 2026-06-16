import { PasswordHash } from '@domain/value-objects';

describe('PasswordHash Value Object', () => {
  describe('create', () => {
    it('should create a valid password hash', () => {
      const hash = '$2b$12$LJ3m4ys3Lk5x7D8k9n0Ae.1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z';
      const passwordHash = PasswordHash.create(hash);
      expect(passwordHash.getValue()).toBe(hash);
    });

    it('should reject empty strings', () => {
      expect(() => PasswordHash.create('')).toThrow('Password hash is required');
    });

    it('should reject null or undefined', () => {
      expect(() => PasswordHash.create(null as unknown as string)).toThrow('Password hash is required');
      expect(() => PasswordHash.create(undefined as unknown as string)).toThrow('Password hash is required');
    });

    it('should reject hashes shorter than 16 characters', () => {
      expect(() => PasswordHash.create('short')).toThrow('Invalid password hash');
    });
  });

  describe('equals', () => {
    it('should return true for identical hashes', () => {
      const hash1 = PasswordHash.create('$2b$12$LJ3m4ys3Lk5x7D8k9n0Ae.1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z');
      const hash2 = PasswordHash.create('$2b$12$LJ3m4ys3Lk5x7D8k9n0Ae.1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z');
      expect(hash1.equals(hash2)).toBe(true);
    });

    it('should return false for different hashes', () => {
      const hash1 = PasswordHash.create('$2b$12$LJ3m4ys3Lk5x7D8k9n0Ae.1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z');
      const hash2 = PasswordHash.create('$2b$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
      expect(hash1.equals(hash2)).toBe(false);
    });
  });
});
