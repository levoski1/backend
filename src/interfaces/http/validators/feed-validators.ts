import { z } from 'zod';

export const postTypeEnum = z.enum(['general', 'prayer_request', 'devotional_share', 'scripture']);

export const createPostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Content must be at least 1 character')
    .max(5000, 'Content must not exceed 5000 characters'),
  isAnonymous: z.boolean().optional().default(false),
  postType: postTypeEnum.optional().default('general'),
});

export const updatePostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Content must be at least 1 character')
    .max(5000, 'Content must not exceed 5000 characters'),
});

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Comment must be at least 1 character')
    .max(1000, 'Comment must not exceed 1000 characters'),
  isAnonymous: z.boolean().optional().default(false),
});

export const reactionTypeEnum = z.enum(['prayer', 'heart', 'amen']);

export const addReactionSchema = z.object({
  reactionType: reactionTypeEnum,
});

export const cursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      const num = val ? parseInt(val, 10) : 20;
      return isNaN(num) ? 20 : Math.min(Math.max(num, 1), 100);
    }),
  sort: z.enum(['recent', 'trending']).optional().default('recent'),
  type: postTypeEnum.optional(),
});

export const postIdParamSchema = z.object({
  postId: z.string().uuid('Post ID must be a valid UUID'),
});

export const commentIdParamSchema = z.object({
  commentId: z.string().uuid('Comment ID must be a valid UUID'),
});

export const postAndCommentIdParamSchema = z.object({
  postId: z.string().uuid('Post ID must be a valid UUID'),
  commentId: z.string().uuid('Comment ID must be a valid UUID'),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type AddReactionInput = z.infer<typeof addReactionSchema>;
export type CursorPaginationInput = z.infer<typeof cursorPaginationSchema>;
