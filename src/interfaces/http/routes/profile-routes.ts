import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema, updatePrivacySchema, updateSettingsSchema, userIdParamSchema } from '../validators/profile-validators.js';
import {
  getPublicProfile,
  getMyProfile,
  updateMyProfile,
  updateMyPhoto,
  updateMyPrivacy,
  updateMySettings,
  deleteMyAccount,
} from '../controllers/profile-controller.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error('Invalid file type. Allowed: JPEG, PNG, WebP'));
      return;
    }
    cb(null, true);
  },
});

/**
 * @openapi
 * /profile/{userId}:
 *   get:
 *     tags: [Profile]
 *     summary: Fetch any user's public profile
 *     description: Returns a public profile for the given user ID. Respects the user's privacy settings — returns 404 if profile is set to private.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the user
 *     responses:
 *       200:
 *         description: Public profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       $ref: '#/components/schemas/PublicProfile'
 *                 meta:
 *                   $ref: '#/components/schemas/ErrorResponse/properties/meta'
 *       404:
 *         description: User or profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/**
 * @openapi
 * /profile/me:
 *   get:
 *     tags: [Profile]
 *     summary: Fetch authenticated user's full profile
 *     description: Returns the complete profile for the currently authenticated user, including privacy settings, email, phone number, and account details.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Full profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       $ref: '#/components/schemas/FullProfile'
 *                 meta:
 *                   $ref: '#/components/schemas/ErrorResponse/properties/meta'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', authenticate, getMyProfile);

/**
 * @openapi
 * /profile/me:
 *   put:
 *     tags: [Profile]
 *     summary: Update authenticated user's profile details
 *     description: Updates profile fields such as display name, bio, denomination, spiritual interests, and timezone.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileInput'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       type: object
 *                       properties:
 *                         displayName:
 *                           type: string
 *                         bio:
 *                           type: string
 *                           nullable: true
 *                         avatarUrl:
 *                           type: string
 *                           nullable: true
 *                         denomination:
 *                           type: string
 *                           nullable: true
 *                         spiritualInterests:
 *                           type: array
 *                           items:
 *                             type: string
 *                         timezone:
 *                           type: string
 *                 meta:
 *                   $ref: '#/components/schemas/ErrorResponse/properties/meta'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/me', authenticate, validate(updateProfileSchema), updateMyProfile);

/**
 * @openapi
 * /profile/me/photo:
 *   put:
 *     tags: [Profile]
 *     summary: Upload and update profile photo
 *     description: Uploads a new profile photo to Supabase Storage. Accepts JPEG, PNG, or WebP files up to 5MB.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Profile photo file (JPEG, PNG, or WebP, max 5MB)
 *     responses:
 *       200:
 *         description: Photo uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     avatarUrl:
 *                       type: string
 *                       format: uri
 *                 meta:
 *                   $ref: '#/components/schemas/ErrorResponse/properties/meta'
 *       400:
 *         description: Invalid file or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/me/photo', authenticate, upload.single('photo'), updateMyPhoto);

/**
 * @openapi
 * /profile/me/privacy:
 *   put:
 *     tags: [Profile]
 *     summary: Update privacy settings and anonymous posting preference
 *     description: Updates the authenticated user's privacy settings including profile visibility, faith info display, and anonymous posting preference.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePrivacyInput'
 *     responses:
 *       200:
 *         description: Privacy settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     privacySettings:
 *                       $ref: '#/components/schemas/PrivacySettings'
 *                 meta:
 *                   $ref: '#/components/schemas/ErrorResponse/properties/meta'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/me/privacy', authenticate, validate(updatePrivacySchema), updateMyPrivacy);

/**
 * @openapi
 * /profile/me/settings:
 *   put:
 *     tags: [Profile]
 *     summary: Update notification preferences and account settings
 *     description: Updates the authenticated user's notification preferences including prayer reminders, community updates, and streak alerts.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSettingsInput'
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     settings:
 *                       type: object
 *                       properties:
 *                         prayerReminders:
 *                           type: boolean
 *                         communityUpdates:
 *                           type: boolean
 *                         streakAlerts:
 *                           type: boolean
 *                 meta:
 *                   $ref: '#/components/schemas/ErrorResponse/properties/meta'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/me/settings', authenticate, validate(updateSettingsSchema), updateMySettings);

/**
 * @openapi
 * /profile/me:
 *   delete:
 *     tags: [Profile]
 *     summary: Delete account and all associated data (NDPA compliance)
 *     description: Permanently deletes the authenticated user's account and all associated data including posts, comments, prayer requests, and personal data. This action is irreversible.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: null
 *                 meta:
 *                   $ref: '#/components/schemas/ErrorResponse/properties/meta'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/me', authenticate, deleteMyAccount);

/**
 * @openapi
 * /profile/{userId}:
 *   get:
 *     tags: [Profile]
 *     summary: Fetch any user's public profile
 *     description: Returns a public profile for the given user ID. Respects the user's privacy settings — returns 404 if profile is set to private.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the user
 *     responses:
 *       200:
 *         description: Public profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       $ref: '#/components/schemas/PublicProfile'
 *                 meta:
 *                   $ref: '#/components/schemas/ErrorResponse/properties/meta'
 *       404:
 *         description: User or profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:userId', validate(userIdParamSchema, 'params'), getPublicProfile);

export default router;
