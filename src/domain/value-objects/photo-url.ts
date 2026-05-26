import { ValidationError } from '@shared/errors';

export class PhotoUrl {
  private static readonly MAX_LENGTH = 512;

  private constructor(private readonly value: string) {}

  static create(value: string): PhotoUrl {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('Photo URL is required');
    }
    const trimmed = value.trim();
    if (trimmed.length > PhotoUrl.MAX_LENGTH) {
      throw new ValidationError(`Photo URL must not exceed ${PhotoUrl.MAX_LENGTH} characters`);
    }
    try {
      new URL(trimmed);
    } catch {
      throw new ValidationError(`Invalid photo URL: ${trimmed}`);
    }
    return new PhotoUrl(trimmed);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: PhotoUrl): boolean {
    return this.value === other.value;
  }
}
