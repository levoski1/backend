import { PrivacySettings } from '@domain/value-objects';

describe('PrivacySettings Value Object', () => {
  describe('create', () => {
    it('should create with custom settings', () => {
      const settings = new PrivacySettings({
        profileVisibility: 'private',
        showFaithInfo: false,
      });
      expect(settings.profileVisibility).toBe('private');
      expect(settings.showFaithInfo).toBe(false);
    });
  });

  describe('defaults', () => {
    it('should provide sensible defaults', () => {
      const defaults = PrivacySettings.defaults();
      expect(defaults.profileVisibility).toBe('public');
      expect(defaults.showFaithInfo).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for identical settings', () => {
      const s1 = new PrivacySettings({ profileVisibility: 'private', showFaithInfo: false });
      const s2 = new PrivacySettings({ profileVisibility: 'private', showFaithInfo: false });
      expect(s1.equals(s2)).toBe(true);
    });

    it('should return false for different settings', () => {
      const s1 = new PrivacySettings({ profileVisibility: 'public', showFaithInfo: true });
      const s2 = new PrivacySettings({ profileVisibility: 'private', showFaithInfo: true });
      expect(s1.equals(s2)).toBe(false);
    });
  });
});
