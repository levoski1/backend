import { ValidationError } from '@shared/errors';

export interface FaithProfileParams {
  denomination: string;
}

export class FaithProfile {
  public readonly denomination: string;

  constructor(params: FaithProfileParams) {
    if (!params.denomination || typeof params.denomination !== 'string') {
      throw new ValidationError('Denomination is required');
    }
    const trimmed = params.denomination.trim();
    if (trimmed.length < 2) {
      throw new ValidationError('Denomination must be at least 2 characters');
    }
    if (trimmed.length > 100) {
      throw new ValidationError('Denomination must not exceed 100 characters');
    }
    this.denomination = trimmed;
  }

  equals(other: FaithProfile): boolean {
    return this.denomination === other.denomination;
  }
}
