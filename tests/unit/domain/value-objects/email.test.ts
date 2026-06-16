import { Email } from '@domain/value-objects';

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create a valid email', () => {
      const email = Email.create('test@example.com');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should normalize to lowercase', () => {
      const email = Email.create('Test@Example.COM');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const email = Email.create('  user@email.com  ');
      expect(email.getValue()).toBe('user@email.com');
    });

    it('should reject empty strings', () => {
      expect(() => Email.create('')).toThrow('Email is required');
    });

    it('should reject null or undefined', () => {
      expect(() => Email.create(null as unknown as string)).toThrow('Email is required');
      expect(() => Email.create(undefined as unknown as string)).toThrow('Email is required');
    });

    it('should reject missing @ symbol', () => {
      expect(() => Email.create('invalid-email')).toThrow('Invalid email format');
    });

    it('should reject missing domain', () => {
      expect(() => Email.create('user@')).toThrow('Invalid email format');
    });

    it('should reject missing local part', () => {
      expect(() => Email.create('@example.com')).toThrow('Invalid email format');
    });

    it('should reject strings over 255 characters', () => {
      const local = 'a'.repeat(256);
      expect(() => Email.create(`${local}@b.com`)).toThrow('must not exceed 255 characters');
    });
  });

  describe('equals', () => {
    it('should return true for identical emails', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different emails', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('other@example.com');
      expect(email1.equals(email2)).toBe(false);
    });

    it('should handle case-insensitive equality', () => {
      const email1 = Email.create('Test@Example.COM');
      const email2 = Email.create('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });
  });
});
