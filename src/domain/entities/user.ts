import type { Email, PasswordHash, PhotoUrl, FaithProfile } from '../value-objects/index.js';
import {
  AccountStatus,
  AuthProvider,
  PrivacySettings,
} from '../value-objects/index.js';
import { ValidationError } from '../../shared/errors/index.js';

export type UserRole = 'user' | 'admin' | 'moderator';

export interface UserParams {
  id: string;
  fullName: string;
  email: Email;
  passwordHash: PasswordHash;
  accountStatus: AccountStatus;
  authProvider: AuthProvider;
  emailVerified: boolean;
  privacySettings: PrivacySettings;
  createdAt: Date;
  updatedAt: Date;
  role?: UserRole;
  profilePhotoUrl?: PhotoUrl;
  faithProfile?: FaithProfile;
}

export class User {
  public readonly id: string;
  public readonly fullName: string;
  public readonly email: Email;
  public readonly passwordHash: PasswordHash;
  public readonly accountStatus: AccountStatus;
  public readonly authProvider: AuthProvider;
  public readonly emailVerified: boolean;
  public readonly privacySettings: PrivacySettings;
  public readonly role: UserRole;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  public readonly profilePhotoUrl?: PhotoUrl;
  public readonly faithProfile?: FaithProfile;

  constructor(params: UserParams) {
    this.validateId(params.id);
    this.validateFullName(params.fullName);

    this.id = params.id.trim();
    this.fullName = params.fullName.trim();
    this.email = params.email;
    this.passwordHash = params.passwordHash;
    this.accountStatus = params.accountStatus;
    this.authProvider = params.authProvider;
    this.emailVerified = params.emailVerified;
    this.privacySettings = params.privacySettings;
    this.role = params.role ?? 'user';
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
    this.profilePhotoUrl = params.profilePhotoUrl;
    this.faithProfile = params.faithProfile;
  }

  static create(params: Omit<UserParams, 'accountStatus' | 'emailVerified' | 'privacySettings' | 'createdAt' | 'updatedAt'> & { accountStatus?: AccountStatus; emailVerified?: boolean; privacySettings?: PrivacySettings }): User {
    const now = new Date();
    return new User({
      ...params,
      accountStatus: params.accountStatus ?? AccountStatus.ACTIVE,
      emailVerified: params.emailVerified ?? false,
      privacySettings: params.privacySettings ?? PrivacySettings.defaults(),
      createdAt: now,
      updatedAt: now,
    });
  }

  isActive(): boolean {
    return this.accountStatus === AccountStatus.ACTIVE;
  }

  canLogin(): boolean {
    if (this.accountStatus !== AccountStatus.ACTIVE) {
      return false;
    }
    if (this.authProvider === AuthProvider.EMAIL && !this.emailVerified) {
      return false;
    }
    return true;
  }

  markEmailVerified(): User {
    return new User({
      ...this.toParams(),
      emailVerified: true,
      updatedAt: new Date(),
    });
  }

  suspend(): User {
    if (this.accountStatus === AccountStatus.BANNED) {
      throw new ValidationError('Cannot suspend a banned user');
    }
    return new User({
      ...this.toParams(),
      accountStatus: AccountStatus.SUSPENDED,
      updatedAt: new Date(),
    });
  }

  ban(): User {
    return new User({
      ...this.toParams(),
      accountStatus: AccountStatus.BANNED,
      updatedAt: new Date(),
    });
  }

  activate(): User {
    return new User({
      ...this.toParams(),
      accountStatus: AccountStatus.ACTIVE,
      updatedAt: new Date(),
    });
  }

  updateFaithProfile(faithProfile: FaithProfile): User {
    return new User({
      ...this.toParams(),
      faithProfile,
      updatedAt: new Date(),
    });
  }

  updatePrivacySettings(privacySettings: PrivacySettings): User {
    return new User({
      ...this.toParams(),
      privacySettings,
      updatedAt: new Date(),
    });
  }

  updatePhotoUrl(profilePhotoUrl: PhotoUrl): User {
    return new User({
      ...this.toParams(),
      profilePhotoUrl,
      updatedAt: new Date(),
    });
  }

  removePhotoUrl(): User {
    return new User({
      ...this.toParams(),
      profilePhotoUrl: undefined,
      updatedAt: new Date(),
    });
  }

  toParams(): UserParams {
    return {
      id: this.id,
      fullName: this.fullName,
      email: this.email,
      passwordHash: this.passwordHash,
      accountStatus: this.accountStatus,
      authProvider: this.authProvider,
      emailVerified: this.emailVerified,
      privacySettings: this.privacySettings,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      profilePhotoUrl: this.profilePhotoUrl,
      faithProfile: this.faithProfile,
    };
  }

  private validateId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('User ID is required');
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id.trim())) {
      throw new ValidationError('User ID must be a valid UUID');
    }
  }

  private validateFullName(name: string): void {
    if (!name || typeof name !== 'string') {
      throw new ValidationError('Full name is required');
    }
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      throw new ValidationError('Full name must be at least 2 characters');
    }
    if (trimmed.length > 50) {
      throw new ValidationError('Full name must not exceed 50 characters');
    }
  }
}
