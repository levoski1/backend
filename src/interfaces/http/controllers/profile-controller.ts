import type { Request, Response } from 'express';
import type { Profile, User } from '../../../domain/index.js';
import { ProfileService } from '../../../application/profile/profile-service.js';
import { asyncHandler } from '../../../shared/utils/index.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import { ValidationError } from '../../../shared/errors/index.js';

const profileService = new ProfileService();

function sanitizePublicProfile(profile: Profile, user: User) {
  return {
    displayName: profile.displayName,
    bio: profile.bio ?? null,
    avatarUrl: profile.avatarUrl ?? user.profilePhotoUrl?.getValue() ?? null,
    denomination: profile.denomination ?? null,
    spiritualInterests: profile.spiritualInterests,
    timezone: profile.timezone,
  };
}

function sanitizeFullProfile(profile: Profile, user: User) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email.getValue(),
    displayName: profile.displayName,
    bio: profile.bio ?? null,
    avatarUrl: profile.avatarUrl ?? user.profilePhotoUrl?.getValue() ?? null,
    denomination: profile.denomination ?? user.faithProfile?.denomination ?? null,
    spiritualInterests: profile.spiritualInterests,
    timezone: profile.timezone,
    phoneNumber: user.phoneNumber ?? null,
    privacySettings: {
      profileVisibility: user.privacySettings.profileVisibility,
      showFaithInfo: user.privacySettings.showFaithInfo,
      anonymousPosting: user.privacySettings.anonymousPosting,
    },
    accountStatus: user.accountStatus,
    authProvider: user.authProvider,
    emailVerified: user.emailVerified,
  };
}

export const getPublicProfile = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const { profile, user } = await profileService.getPublicProfile(userId);

  res.status(200).json({
    success: true,
    data: {
      profile: sanitizePublicProfile(profile, user),
    },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});

export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;

  const { profile, user } = await profileService.getFullProfile(userId);

  res.status(200).json({
    success: true,
    data: {
      profile: sanitizeFullProfile(profile, user),
    },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});

export const updateMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;

  const profile = await profileService.updateProfile(userId, req.body);

  res.status(200).json({
    success: true,
    data: {
      profile: {
        displayName: profile.displayName,
        bio: profile.bio ?? null,
        avatarUrl: profile.avatarUrl ?? null,
        denomination: profile.denomination ?? null,
        spiritualInterests: profile.spiritualInterests,
        timezone: profile.timezone,
      },
    },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});

export const updateMyPhoto = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;

  const file = req.file;

  if (!file) {
    throw new ValidationError('Photo file is required');
  }

  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new ValidationError('Invalid file type. Allowed: JPEG, PNG, WebP');
  }

  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new ValidationError('File size exceeds 5MB limit');
  }

  const url = await profileService.updatePhoto(userId, file.buffer, file.mimetype);

  res.status(200).json({
    success: true,
    data: {
      avatarUrl: url,
    },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});

export const updateMyPrivacy = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;

  const privacySettings = await profileService.updatePrivacy(userId, req.body);

  res.status(200).json({
    success: true,
    data: {
      privacySettings: {
        profileVisibility: privacySettings.profileVisibility,
        showFaithInfo: privacySettings.showFaithInfo,
        anonymousPosting: privacySettings.anonymousPosting,
      },
    },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});

export const updateMySettings = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;

  const settings = await profileService.updateSettings(userId, req.body);

  res.status(200).json({
    success: true,
    data: {
      settings,
    },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});

export const deleteMyAccount = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;

  await profileService.deleteAccount(userId);

  res.status(200).json({
    success: true,
    data: null,
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});
