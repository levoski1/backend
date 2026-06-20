import { getDb } from '../connection.js';
import { Profile } from '../../../domain/index.js';
import { InternalError, NotFoundError } from '../../../shared/errors/index.js';
import type { Knex } from '../connection.js';

interface ProfileRow {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  denomination: string | null;
  spiritual_interests: string[] | string;
  timezone: string;
  notification_settings?: Record<string, boolean> | string | null;
  created_at: string;
  updated_at: string;
}

function rowToProfile(row: ProfileRow): Profile {
  const interests = typeof row.spiritual_interests === 'string'
    ? JSON.parse(row.spiritual_interests)
    : row.spiritual_interests;

  return new Profile({
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    bio: row.bio ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    denomination: row.denomination ?? undefined,
    spiritualInterests: Array.isArray(interests) ? interests : [],
    timezone: row.timezone,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
}

function profileToRow(profile: Profile): Omit<ProfileRow, 'id' | 'created_at' | 'updated_at' | 'notification_settings'> {
  return {
    user_id: profile.userId,
    display_name: profile.displayName,
    bio: profile.bio ?? null,
    avatar_url: profile.avatarUrl ?? null,
    denomination: profile.denomination ?? null,
    spiritual_interests: JSON.stringify(profile.spiritualInterests),
    timezone: profile.timezone,
  };
}

export class ProfileRepository {
  private db: Knex;

  constructor(db?: Knex) {
    this.db = db ?? getDb();
  }

  async findByUserId(userId: string): Promise<Profile | null> {
    const row = await this.db<ProfileRow>('profiles')
      .where({ user_id: userId })
      .first();

    if (!row) {
      return null;
    }
    return rowToProfile(row);
  }

  async findById(id: string): Promise<Profile | null> {
    const row = await this.db<ProfileRow>('profiles')
      .where({ id })
      .first();

    if (!row) {
      return null;
    }
    return rowToProfile(row);
  }

  async create(profile: Profile): Promise<Profile> {
    const [inserted] = await this.db<ProfileRow>('profiles')
      .insert({ id: profile.id, ...profileToRow(profile) })
      .returning('*');

    if (!inserted) {
      throw new InternalError('Failed to create profile');
    }

    return rowToProfile(inserted);
  }

  async update(profile: Profile): Promise<Profile> {
    const [updated] = await this.db<ProfileRow>('profiles')
      .where({ id: profile.id })
      .update({
        ...profileToRow(profile),
        updated_at: new Date().toISOString(),
      })
      .returning('*');

    if (!updated) {
      throw new NotFoundError('Profile');
    }

    return rowToProfile(updated);
  }

  async getNotificationSettings(userId: string): Promise<Record<string, boolean>> {
    const defaults = { prayerReminders: true, communityUpdates: true, streakAlerts: true };

    const row = await this.db<ProfileRow>('profiles')
      .where({ user_id: userId })
      .select('notification_settings')
      .first();

    if (!row?.notification_settings) {
      return defaults;
    }

    const settings = typeof row.notification_settings === 'string'
      ? JSON.parse(row.notification_settings)
      : row.notification_settings;

    return { ...defaults, ...settings };
  }

  async updateNotificationSettings(userId: string, settings: Record<string, boolean>): Promise<void> {
    const settingsJson = JSON.stringify(settings);
    await this.db('profiles')
      .where({ user_id: userId })
      .update({
        notification_settings: this.db.raw('?::jsonb', settingsJson),
        updated_at: new Date().toISOString(),
      });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.db('profiles')
      .where({ user_id: userId })
      .del();
  }
}
