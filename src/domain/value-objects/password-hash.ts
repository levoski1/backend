import { ValidationError } from '@shared/errors';

export class PasswordHash {
  private constructor(private readonly value: string) {}

  static create(value: string): PasswordHash {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('Password hash is required');
    }
    if (value.length < 16) {
      throw new ValidationError('Invalid password hash');
    }
    return new PasswordHash(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: PasswordHash): boolean {
    return this.value === other.value;
  }
}
