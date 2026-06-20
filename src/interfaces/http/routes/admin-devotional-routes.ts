import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import {
  devotionalIdParamSchema,
  createDevotionalSchema,
  updateDevotionalSchema,
} from '../validators/devotional-validators.js';
import {
  createDevotional,
  updateDevotional,
  deleteDevotional,
} from '../controllers/admin-devotional-controller.js';

const router = Router();

/**
 * @openapi
 * /admin/devotionals:
 *   post:
 *     tags: [Admin]
 *     summary: Create a new devotional entry (Admin only)
 *     description: Creates a new devotional entry. Requires admin authentication.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDevotionalInput'
 *     responses:
 *       201:
 *         description: Devotional created successfully
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
 *       403:
 *         description: Forbidden — admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', authenticate, validate(createDevotionalSchema), createDevotional);

/**
 * @openapi
 * /admin/devotionals/{devotionalId}:
 *   put:
 *     tags: [Admin]
 *     summary: Update a devotional entry (Admin only)
 *     description: Updates an existing devotional entry. Requires admin authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: devotionalId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the devotional to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateDevotionalInput'
 *     responses:
 *       200:
 *         description: Devotional updated successfully
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
 *       403:
 *         description: Forbidden — admin access required
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
router.put('/:devotionalId', authenticate, validate(devotionalIdParamSchema, 'params'), validate(updateDevotionalSchema), updateDevotional);

/**
 * @openapi
 * /admin/devotionals/{devotionalId}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a devotional entry (Admin only)
 *     description: Deletes an existing devotional entry. Requires admin authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: devotionalId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the devotional to delete
 *     responses:
 *       200:
 *         description: Devotional deleted successfully
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
 *       403:
 *         description: Forbidden — admin access required
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
router.delete('/:devotionalId', authenticate, validate(devotionalIdParamSchema, 'params'), deleteDevotional);

export default router;
