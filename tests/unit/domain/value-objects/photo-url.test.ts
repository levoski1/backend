import { PhotoUrl } from '@domain/value-objects';

describe('PhotoUrl Value Object', () => {
  describe('create', () => {
    it('should create a valid http URL', () => {
      const url = PhotoUrl.create('http://example.com/photo.jpg');
      expect(url.getValue()).toBe('http://example.com/photo.jpg');
    });

    it('should create a valid https URL', () => {
      const url = PhotoUrl.create('https://storage.example.com/images/profile.png');
      expect(url.getValue()).toBe('https://storage.example.com/images/profile.png');
    });

    it('should reject empty strings', () => {
      expect(() => PhotoUrl.create('')).toThrow('Photo URL is required');
    });

    it('should reject invalid URL format', () => {
      expect(() => PhotoUrl.create('not-a-url')).toThrow('Invalid photo URL');
    });

    it('should reject URLs over 512 characters', () => {
      const domain = 'https://example.com/' + 'a'.repeat(500);
      expect(() => PhotoUrl.create(domain)).toThrow('must not exceed 512 characters');
    });

    it('should trim whitespace', () => {
      const url = PhotoUrl.create('  https://example.com/photo.jpg  ');
      expect(url.getValue()).toBe('https://example.com/photo.jpg');
    });
  });

  describe('equals', () => {
    it('should return true for identical URLs', () => {
      const url1 = PhotoUrl.create('https://example.com/photo.jpg');
      const url2 = PhotoUrl.create('https://example.com/photo.jpg');
      expect(url1.equals(url2)).toBe(true);
    });

    it('should return false for different URLs', () => {
      const url1 = PhotoUrl.create('https://example.com/photo1.jpg');
      const url2 = PhotoUrl.create('https://example.com/photo2.jpg');
      expect(url1.equals(url2)).toBe(false);
    });
  });
});
