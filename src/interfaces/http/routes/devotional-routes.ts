import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import {
  devotionalIdParamSchema,
} from '../validators/devotional-validators.js';
import {
  getToday,
  getArchive,
  getByIdentifier,
  completeDevotional,
} from '../controllers/devotional-controller.js';

const router = Router();

/**
 * @openapi
 * /devotionals/today:
 *   get:
 *     tags: [Devotionals]
 *     summary: Fetch today's devotional
 *     description: Returns the devotional for today's date. If no devotional exists for today, returns the most recently published devotional. Optionally authenticated — include Bearer token to get read status.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's devotional retrieved successfully
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
 *                     devotional:
 *                       $ref: '#/components/schemas/Devotional'
 *                 meta:
 *                   $ref: '#/components/schemas/ErrorResponse/properties/meta'
 *       404:
 *         description: No devotional available
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/today', getToday);

/**
 * @openapi
 * /devotionals/archive:
 *   get:
 *     tags: [Devotionals]
 *     summary: Fetch devotional archive
 *     description: Returns the last 30 days of devotionals with the user's read status. Optionally authenticated.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Archive retrieved successfully
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
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/DevotionalArchiveItem'
 *                 meta:
 *                   $ref: '#/components/schemas/ErrorResponse/properties/meta'
 */
router.get('/archive', getArchive);

/**
 * @openapi
 * /devotionals/{identifier}:
 *   get:
 *     tags: [Devotionals]
 *     summary: Fetch devotional by date or ID
 *     description: Returns a devotional by date (YYYY-MM-DD) or UUID. If identifier is a date, returns the devotional for that date. If identifier is a UUID, returns that specific devotional.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *         description: Date in YYYY-MM-DD format or devotional UUID
 *     responses:
 *       200:
 *         description: Devotional retrieved successfully
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
 *                     devotional:
 *                       $ref: '#/components/schemas/Devotional'
 *                 meta:
 *                   $ref: '#/components/schemas/ErrorResponse/properties/meta'
 *       400:
 *         description: Invalid identifier format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Devotional not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:identifier', getByIdentifier);

/**
 * @openapi
 * /devotionals/{devotionalId}/complete:
 *   post:
 *     tags: [Devotionals]
 *     summary: Mark devotional as completed
 *     description: Marks a devotional as read by the authenticated user and triggers a streak update.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: devotionalId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the devotional to mark as complete
 *     responses:
 *       200:
 *         description: Devotional marked as completed, streak updated
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
 *                     streak:
 *                       $ref: '#/components/schemas/Streak'
 *                     milestoneReached:
 *                       nullable: true
 *                       $ref: '#/components/schemas/StreakMilestone'
 *                 meta:
 *                   $ref: '#/components/schemas/ErrorResponse/properties/meta'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Devotional not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Devotional already completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:devotionalId/complete', authenticate, validate(devotionalIdParamSchema, 'params'), completeDevotional);

export default router;
