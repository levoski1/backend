import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import {
  createPostSchema,
  updatePostSchema,
  createCommentSchema,
  addReactionSchema,
  cursorPaginationSchema,
  postIdParamSchema,
  postAndCommentIdParamSchema,
} from '../validators/feed-validators.js';
import {
  createPost,
  getFeed,
  getPost,
  updatePost,
  deletePost,
} from '../controllers/post-controller.js';
import {
  addComment,
  getComments,
  deleteComment,
} from '../controllers/comment-controller.js';
import {
  addReaction,
  removeReaction,
} from '../controllers/reaction-controller.js';

const router = Router();

/**
 * @openapi
 * /posts:
 *   post:
 *     tags: [Feed]
 *     summary: Create a new post
 *     description: Creates a new community feed post. Posts can be anonymous and of various types (prayer, advice, testimony, gratitude).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePostInput'
 *     responses:
 *       201:
 *         description: Post created successfully
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
 *                     post:
 *                       $ref: '#/components/schemas/Post'
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
router.post('/', authenticate, validate(createPostSchema), createPost);

/**
 * @openapi
 * /posts:
 *   get:
 *     tags: [Feed]
 *     summary: Fetch community feed with pagination
 *     description: Returns a paginated feed of posts sorted by recent or trending. Supports cursor-based pagination for performance.
 *     parameters:
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor from previous page response for cursor-based pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of posts per page (max 100)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [recent, trending]
 *           default: recent
 *         description: Sort order — recent (newest first) or trending (reaction count + recency)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [prayer, advice, testimony, gratitude]
 *         description: Filter by post type
 *     responses:
 *       200:
 *         description: Feed retrieved successfully
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
 *                         $ref: '#/components/schemas/Post'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         nextCursor:
 *                           type: string
 *                           nullable: true
 *                         hasMore:
 *                           type: boolean
 *                 meta:
 *                   $ref: '#/components/schemas/ErrorResponse/properties/meta'
 */
router.get('/', validate(cursorPaginationSchema, 'query'), getFeed);

/**
 * @openapi
 * /posts/{postId}:
 *   get:
 *     tags: [Feed]
 *     summary: Fetch a single post with comments and reactions
 *     description: Returns a single post by ID, including comment count, reaction counts, and author information.
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the post
 *     responses:
 *       200:
 *         description: Post retrieved successfully
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
 *                     post:
 *                       $ref: '#/components/schemas/Post'
 *                 meta:
 *                   $ref: '#/components/schemas/ErrorResponse/properties/meta'
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:postId', validate(postIdParamSchema, 'params'), getPost);

/**
 * @openapi
 * /posts/{postId}:
 *   put:
 *     tags: [Feed]
 *     summary: Edit own post
 *     description: Updates the content of a post owned by the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePostInput'
 *     responses:
 *       200:
 *         description: Post updated successfully
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
 *                     post:
 *                       $ref: '#/components/schemas/Post'
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
 *         description: Forbidden — not your post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:postId', authenticate, validate(postIdParamSchema, 'params'), validate(updatePostSchema), updatePost);

/**
 * @openapi
 * /posts/{postId}:
 *   delete:
 *     tags: [Feed]
 *     summary: Delete own post
 *     description: Deletes a post owned by the authenticated user. All associated comments and reactions are also removed.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the post
 *     responses:
 *       200:
 *         description: Post deleted successfully
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
 *         description: Forbidden — not your post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:postId', authenticate, validate(postIdParamSchema, 'params'), deletePost);

/**
 * @openapi
 * /posts/{postId}/comments:
 *   post:
 *     tags: [Feed]
 *     summary: Add a comment to a post
 *     description: Adds a new comment to a community feed post. Comments can be anonymous.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCommentInput'
 *     responses:
 *       201:
 *         description: Comment created successfully
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
 *                     comment:
 *                       $ref: '#/components/schemas/Comment'
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
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:postId/comments', authenticate, validate(postIdParamSchema, 'params'), validate(createCommentSchema), addComment);

/**
 * @openapi
 * /posts/{postId}/comments:
 *   get:
 *     tags: [Feed]
 *     summary: Fetch all comments for a post
 *     description: Returns all comments for a given post, with author information and anonymous masking.
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the post
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
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
 *                     comments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Comment'
 *                 meta:
 *                   $ref: '#/components/schemas/ErrorResponse/properties/meta'
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:postId/comments', validate(postIdParamSchema, 'params'), getComments);

/**
 * @openapi
 * /posts/{postId}/comments/{commentId}:
 *   delete:
 *     tags: [Feed]
 *     summary: Delete own comment
 *     description: Deletes a comment owned by the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the post
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the comment
 *     responses:
 *       200:
 *         description: Comment deleted successfully
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
 *         description: Forbidden — not your comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Comment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:postId/comments/:commentId', authenticate, validate(postAndCommentIdParamSchema, 'params'), deleteComment);

/**
 * @openapi
 * /posts/{postId}/reactions:
 *   post:
 *     tags: [Feed]
 *     summary: Add a reaction to a post
 *     description: Adds a reaction (prayer, heart, or amen) to a post. A user can only react once per reaction type per post.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddReactionInput'
 *     responses:
 *       201:
 *         description: Reaction added successfully
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
 *                     reactionCounts:
 *                       type: object
 *                       properties:
 *                         prayer:
 *                           type: integer
 *                         heart:
 *                           type: integer
 *                         amen:
 *                           type: integer
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
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Already reacted with this type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:postId/reactions', authenticate, validate(postIdParamSchema, 'params'), validate(addReactionSchema), addReaction);

/**
 * @openapi
 * /posts/{postId}/reactions:
 *   delete:
 *     tags: [Feed]
 *     summary: Remove a reaction from a post
 *     description: Removes a reaction (prayer, heart, or amen) from a post.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddReactionInput'
 *     responses:
 *       200:
 *         description: Reaction removed successfully
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
 *                     reactionCounts:
 *                       type: object
 *                       properties:
 *                         prayer:
 *                           type: integer
 *                         heart:
 *                           type: integer
 *                         amen:
 *                           type: integer
 *                 meta:
 *                   $ref: '#/components/schemas/ErrorResponse/properties/meta'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Post or reaction not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:postId/reactions', authenticate, validate(postIdParamSchema, 'params'), validate(addReactionSchema), removeReaction);

export default router;
