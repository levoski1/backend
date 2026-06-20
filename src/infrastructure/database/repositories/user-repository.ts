import { getDb } from '../connection.js';
import {
  User,
  Email,
  PasswordHash,
  PhotoUrl,
  PrivacySettings,
  accountStatusFromString,
  authProviderFromString,
} from '../../../domain/index.js';
import { InternalError } from '../../../shared/errors/index.js';
import type { Knex } from '../connection.js';

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  provider_id: string | null;
  auth_provider: string;
  account_status: string;
  role: string;
  email_verified: boolean;
  profile_photo_url: string | null;
  privacy_settings: Record<string, unknown>;
  phone_number: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function rowToUser(row: UserRow): User {
  return new User({
    id: row.id,
    fullName: row.full_name,
    email: Email.create(row.email),
    passwordHash: PasswordHash.create(row.password_hash),
    providerId: row.provider_id ?? undefined,
    accountStatus: accountStatusFromString(row.account_status),
    authProvider: authProviderFromString(row.auth_provider),
    emailVerified: row.email_verified,
    privacySettings: new PrivacySettings({
      profileVisibility: (row.privacy_settings?.profileVisibility as 'public' | 'private') ?? 'public',
      showFaithInfo: (row.privacy_settings?.showFaithInfo as boolean) ?? true,
      anonymousPosting: (row.privacy_settings?.anonymousPosting as boolean) ?? false,
    }),
    role: row.role as 'user' | 'admin' | 'moderator' | undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    profilePhotoUrl: row.profile_photo_url ? PhotoUrl.create(row.profile_photo_url) : undefined,
    phoneNumber: row.phone_number ?? undefined,
  });
}

function userToRow(user: User): Omit<UserRow, 'id' | 'created_at' | 'updated_at' | 'last_login_at' | 'deleted_at' | 'role'> & { role?: string } {
  return {
    full_name: user.fullName,
    email: user.email.getValue(),
    password_hash: user.passwordHash.getValue(),
    provider_id: user.providerId ?? null,
    auth_provider: user.authProvider,
    account_status: user.accountStatus,
    email_verified: user.emailVerified,
    profile_photo_url: user.profilePhotoUrl?.getValue() ?? null,
    phone_number: user.phoneNumber ?? null,
    privacy_settings: {
      profileVisibility: user.privacySettings.profileVisibility,
      showFaithInfo: user.privacySettings.showFaithInfo,
      anonymousPosting: user.privacySettings.anonymousPosting,
    },
  };
}

export class UserRepository {
  private db: Knex;

  constructor(db?: Knex) {
    this.db = db ?? getDb();
  }

  async findByProviderId(providerId: string): Promise<User | null> {
    const row = await this.db<UserRow>('users')
      .where({ provider_id: providerId })
      .whereNull('deleted_at')
      .first();

    if (!row) {
      return null;
    }
    return rowToUser(row);
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db<UserRow>('users')
      .where({ email: email.toLowerCase() })
      .whereNull('deleted_at')
      .first();

    if (!row) {
      return null;
    }
    return rowToUser(row);
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.db<UserRow>('users')
      .where({ id })
      .whereNull('deleted_at')
      .first();

    if (!row) {
      return null;
    }
    return rowToUser(row);
  }

  async create(user: User): Promise<User> {
    const row = userToRow(user);

    const [inserted] = await this.db<UserRow>('users')
      .insert({ id: user.id, ...row })
      .returning('*');

    if (!inserted) {
      throw new InternalError('Failed to create user');
    }

    return rowToUser(inserted);
  }

  async update(user: User): Promise<User> {
    const [updated] = await this.db<UserRow>('users')
      .where({ id: user.id })
      .update({
        ...userToRow(user),
        updated_at: new Date().toISOString(),
      })
      .returning('*');

    if (!updated) {
      throw new InternalError('Failed to update user');
    }

    return rowToUser(updated);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.db('users')
      .where({ id })
      .update({ last_login_at: this.db.fn.now() });
  }
}
