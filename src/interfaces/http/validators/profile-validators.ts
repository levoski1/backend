import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must not exceed 50 characters')
    .optional(),
  bio: z
    .string()
    .trim()
    .max(500, 'Bio must not exceed 500 characters')
    .optional(),
  denomination: z
    .string()
    .trim()
    .min(2, 'Denomination must be at least 2 characters')
    .max(100, 'Denomination must not exceed 100 characters')
    .optional(),
  spiritualInterests: z
    .array(z.string().trim().min(1).max(50))
    .max(20, 'Maximum 20 spiritual interests allowed')
    .optional(),
  timezone: z
    .string()
    .trim()
    .max(50, 'Timezone must not exceed 50 characters')
    .optional(),
});

export const updatePrivacySchema = z.object({
  profileVisibility: z.enum(['public', 'private']).optional(),
  showFaithInfo: z.boolean().optional(),
  anonymousPosting: z.boolean().optional(),
});

export const updateSettingsSchema = z.object({
  prayerReminders: z.boolean().optional(),
  communityUpdates: z.boolean().optional(),
  streakAlerts: z.boolean().optional(),
});

export const userIdParamSchema = z.object({
  userId: z
    .string()
    .uuid('User ID must be a valid UUID'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePrivacyInput = z.infer<typeof updatePrivacySchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
