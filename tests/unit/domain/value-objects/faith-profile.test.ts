import { FaithProfile } from '@domain/value-objects';

describe('FaithProfile Value Object', () => {
  describe('create', () => {
    it('should create a faith profile with denomination', () => {
      const profile = new FaithProfile({ denomination: 'Catholic' });
      expect(profile.denomination).toBe('Catholic');
    });

    it('should trim denomination', () => {
      const profile = new FaithProfile({ denomination: '  Protestant  ' });
      expect(profile.denomination).toBe('Protestant');
    });

    it('should reject empty denomination', () => {
      expect(() => new FaithProfile({ denomination: '' })).toThrow('Denomination is required');
    });

    it('should reject denomination shorter than 2 characters', () => {
      expect(() => new FaithProfile({ denomination: 'A' })).toThrow('at least 2 characters');
    });

    it('should reject denomination over 100 characters', () => {
      expect(() => new FaithProfile({ denomination: 'A'.repeat(101) })).toThrow('not exceed 100 characters');
    });
  });

  describe('equals', () => {
    it('should return true for identical denominations', () => {
      const profile1 = new FaithProfile({ denomination: 'Catholic' });
      const profile2 = new FaithProfile({ denomination: 'Catholic' });
      expect(profile1.equals(profile2)).toBe(true);
    });

    it('should return false for different denominations', () => {
      const profile1 = new FaithProfile({ denomination: 'Catholic' });
      const profile2 = new FaithProfile({ denomination: 'Protestant' });
      expect(profile1.equals(profile2)).toBe(false);
    });
  });
});
