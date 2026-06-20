import { ValidationError } from '../../shared/errors/index.js';

export interface ProfileParams {
  id: string;
  userId: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  denomination?: string;
  spiritualInterests?: string[];
  timezone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Profile {
  public readonly id: string;
  public readonly userId: string;
  public readonly displayName: string;
  public readonly bio?: string;
  public readonly avatarUrl?: string;
  public readonly denomination?: string;
  public readonly spiritualInterests: string[];
  public readonly timezone: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(params: ProfileParams) {
    this.validateId(params.id);
    this.validateUserId(params.userId);
    this.validateDisplayName(params.displayName);

    this.id = params.id.trim();
    this.userId = params.userId.trim();
    this.displayName = params.displayName.trim();
    this.bio = params.bio?.trim();
    this.avatarUrl = params.avatarUrl?.trim();
    this.denomination = params.denomination?.trim();
    this.spiritualInterests = params.spiritualInterests ?? [];
    this.timezone = params.timezone ?? 'UTC';
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }

  static create(params: Omit<ProfileParams, 'createdAt' | 'updatedAt'>): Profile {
    const now = new Date();
    return new Profile({
      ...params,
      createdAt: now,
      updatedAt: now,
    });
  }

  update(params: Partial<Pick<ProfileParams, 'displayName' | 'bio' | 'avatarUrl' | 'denomination' | 'spiritualInterests' | 'timezone'>>): Profile {
    if (params.displayName !== undefined) {
      this.validateDisplayName(params.displayName);
    }
    return new Profile({
      ...this.toParams(),
      displayName: params.displayName?.trim() ?? this.displayName,
      bio: params.bio !== undefined ? params.bio?.trim() : this.bio,
      avatarUrl: params.avatarUrl !== undefined ? params.avatarUrl?.trim() : this.avatarUrl,
      denomination: params.denomination !== undefined ? params.denomination?.trim() : this.denomination,
      spiritualInterests: params.spiritualInterests ?? this.spiritualInterests,
      timezone: params.timezone ?? this.timezone,
      updatedAt: new Date(),
    });
  }

  toPublicProfile() {
    return {
      id: this.id,
      userId: this.userId,
      displayName: this.displayName,
      bio: this.bio,
      avatarUrl: this.avatarUrl,
      denomination: this.denomination,
      spiritualInterests: this.spiritualInterests,
      timezone: this.timezone,
    };
  }

  toFullProfile(userEmail?: string, userFullName?: string) {
    return {
      ...this.toPublicProfile(),
      email: userEmail,
      fullName: userFullName,
    };
  }

  toParams(): ProfileParams {
    return {
      id: this.id,
      userId: this.userId,
      displayName: this.displayName,
      bio: this.bio,
      avatarUrl: this.avatarUrl,
      denomination: this.denomination,
      spiritualInterests: this.spiritualInterests,
      timezone: this.timezone,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  private validateId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Profile ID is required');
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id.trim())) {
      throw new ValidationError('Profile ID must be a valid UUID');
    }
  }

  private validateUserId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('User ID is required');
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id.trim())) {
      throw new ValidationError('User ID must be a valid UUID');
    }
  }

  private validateDisplayName(name: string): void {
    if (!name || typeof name !== 'string') {
      throw new ValidationError('Display name is required');
    }
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      throw new ValidationError('Display name must be at least 2 characters');
    }
    if (trimmed.length > 50) {
      throw new ValidationError('Display name must not exceed 50 characters');
    }
  }
}
