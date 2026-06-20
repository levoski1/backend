import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { getMyStreaks } from '../controllers/streak-controller.js';

const router = Router();

/**
 * @openapi
 * /streaks/me:
 *   get:
 *     tags: [Streaks]
 *     summary: Fetch authenticated user's streak data
 *     description: Returns all streak data for the authenticated user across all discipline types (devotional, prayer, scripture_reading).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Streak data retrieved successfully
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
 *                     streaks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Streak'
 *                 meta:
 *                   $ref: '#/components/schemas/ErrorResponse/properties/meta'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', authenticate, getMyStreaks);

export default router;
