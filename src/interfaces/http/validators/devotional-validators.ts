import { z } from 'zod';

export const dateParamSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export const devotionalIdParamSchema = z.object({
  devotionalId: z.string().uuid('Devotional ID must be a valid UUID'),
});

export const createDevotionalSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(255, 'Title must not exceed 255 characters'),
  scriptureReference: z
    .string()
    .trim()
    .min(1, 'Scripture reference is required')
    .max(255, 'Scripture reference must not exceed 255 characters'),
  scriptureText: z
    .string()
    .trim()
    .min(1, 'Scripture text is required'),
  reflection: z
    .string()
    .trim()
    .min(1, 'Reflection is required'),
  closingPrayer: z
    .string()
    .trim()
    .min(1, 'Closing prayer is required'),
  publishedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Published date must be in YYYY-MM-DD format')
    .transform((val) => new Date(val)),
  author: z
    .string()
    .trim()
    .min(1, 'Author is required')
    .max(255, 'Author must not exceed 255 characters')
    .optional()
    .default('Shelter Team'),
  isPublished: z.boolean().optional().default(true),
});

export const updateDevotionalSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(255, 'Title must not exceed 255 characters')
    .optional(),
  scriptureReference: z
    .string()
    .trim()
    .min(1, 'Scripture reference is required')
    .max(255, 'Scripture reference must not exceed 255 characters')
    .optional(),
  scriptureText: z
    .string()
    .trim()
    .min(1, 'Scripture text is required')
    .optional(),
  reflection: z
    .string()
    .trim()
    .min(1, 'Reflection is required')
    .optional(),
  closingPrayer: z
    .string()
    .trim()
    .min(1, 'Closing prayer is required')
    .optional(),
  publishedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Published date must be in YYYY-MM-DD format')
    .transform((val) => new Date(val))
    .optional(),
  author: z
    .string()
    .trim()
    .min(1, 'Author is required')
    .max(255, 'Author must not exceed 255 characters')
    .optional(),
  isPublished: z.boolean().optional(),
});

export type CreateDevotionalInput = z.infer<typeof createDevotionalSchema>;
export type UpdateDevotionalInput = z.infer<typeof updateDevotionalSchema>;
