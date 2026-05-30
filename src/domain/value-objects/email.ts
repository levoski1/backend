import { ValidationError } from '../../shared/errors/index.js';

export class Email {
  private static readonly PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(private readonly value: string) {}

  static create(value: string): Email {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('Email is required');
    }
    const trimmed = value.trim();
    if (trimmed.length > 255) {
      throw new ValidationError('Email must not exceed 255 characters');
    }
    if (!Email.PATTERN.test(trimmed)) {
      throw new ValidationError(`Invalid email format: ${trimmed}`);
    }
    return new Email(trimmed.toLowerCase());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
