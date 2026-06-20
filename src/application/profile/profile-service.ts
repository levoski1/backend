import { randomUUID } from 'node:crypto';
import { Profile, type User, PrivacySettings } from '../../domain/index.js';
import { ProfileRepository } from '../../infrastructure/database/repositories/profile-repository.js';
import { UserRepository } from '../../infrastructure/database/repositories/user-repository.js';
import { SupabaseStorage } from '../../infrastructure/storage/supabase-storage.js';
import { NotFoundError } from '../../shared/errors/index.js';

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
  denomination?: string;
  spiritualInterests?: string[];
  timezone?: string;
}

export interface UpdatePrivacyInput {
  profileVisibility?: 'public' | 'private';
  showFaithInfo?: boolean;
  anonymousPosting?: boolean;
}

export interface UpdateSettingsInput {
  prayerReminders?: boolean;
  communityUpdates?: boolean;
  streakAlerts?: boolean;
}

export class ProfileService {
  constructor(
    private readonly profileRepo: ProfileRepository = new ProfileRepository(),
    private readonly userRepo: UserRepository = new UserRepository(),
    private readonly storage: SupabaseStorage = new SupabaseStorage(),
  ) {}

  async getPublicProfile(userId: string): Promise<{ profile: Profile; user: User }> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.privacySettings.profileVisibility === 'private') {
      throw new NotFoundError('Profile');
    }

    let profile = await this.profileRepo.findByUserId(userId);
    if (!profile) {
      profile = Profile.create({
        id: randomUUID(),
        userId: user.id,
        displayName: user.fullName,
      });
      profile = await this.profileRepo.create(profile);
    }

    return { profile, user };
  }

  async getFullProfile(userId: string): Promise<{ profile: Profile; user: User }> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    let profile = await this.profileRepo.findByUserId(userId);
    if (!profile) {
      profile = Profile.create({
        id: randomUUID(),
        userId: user.id,
        displayName: user.fullName,
      });
      profile = await this.profileRepo.create(profile);
    }

    return { profile, user };
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<Profile> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    let profile = await this.profileRepo.findByUserId(userId);
    if (!profile) {
      profile = Profile.create({
        id: randomUUID(),
        userId: user.id,
        displayName: input.displayName ?? user.fullName,
      });
    }

    const updated = profile.update({
      displayName: input.displayName,
      bio: input.bio,
      denomination: input.denomination,
      spiritualInterests: input.spiritualInterests,
      timezone: input.timezone,
    });

    return this.profileRepo.update(updated);
  }

  async updatePhoto(userId: string, fileBuffer: Buffer, mimeType: string): Promise<string> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const url = await this.storage.uploadProfilePhoto(userId, fileBuffer, mimeType);

    let profile = await this.profileRepo.findByUserId(userId);
    if (!profile) {
      profile = Profile.create({
        id: randomUUID(),
        userId: user.id,
        displayName: user.fullName,
        avatarUrl: url,
      });
      profile = await this.profileRepo.create(profile);
    } else {
      if (profile.avatarUrl) {
        await this.storage.deletePhoto(profile.avatarUrl).catch(() => {});
      }
      profile = profile.update({ avatarUrl: url });
      await this.profileRepo.update(profile);
    }

    return url;
  }

  async updatePrivacy(userId: string, input: UpdatePrivacyInput): Promise<PrivacySettings> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const currentSettings = user.privacySettings;
    const updatedSettings = new PrivacySettings({
      profileVisibility: input.profileVisibility ?? currentSettings.profileVisibility,
      showFaithInfo: input.showFaithInfo ?? currentSettings.showFaithInfo,
      anonymousPosting: input.anonymousPosting ?? currentSettings.anonymousPosting,
    });

    const updatedUser = user.updatePrivacySettings(updatedSettings);
    await this.userRepo.update(updatedUser);

    return updatedSettings;
  }

  async updateSettings(userId: string, input: UpdateSettingsInput): Promise<Record<string, boolean>> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const current = await this.profileRepo.getNotificationSettings(userId);
    const settings = {
      ...current,
      ...input,
    };

    await this.profileRepo.updateNotificationSettings(userId, settings);
    return settings;
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const db = await import('../../infrastructure/database/connection.js').then(m => m.getDb());

    await db.transaction(async (trx) => {
      await trx('audit_logs').where({ user_id: userId }).del();
      await trx('refresh_tokens').where({ user_id: userId }).del();
      await trx('email_verification_tokens').where({ user_id: userId }).del();
      await trx('password_reset_tokens').where({ user_id: userId }).del();
      await trx('profiles').where({ user_id: userId }).del();
      await trx('users').where({ id: userId }).del();
    });

    if (user.profilePhotoUrl) {
      await this.storage.deletePhoto(user.profilePhotoUrl.getValue()).catch(() => {});
    }
  }
}
