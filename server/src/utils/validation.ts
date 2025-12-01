import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const articleSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  image: z
    .string()
    .refine(
      (val) => {
        if (!val || val === '') return true; // Empty string is valid
        if (val.startsWith('/uploads/')) return true; // Local upload path is valid
        try {
          new URL(val); // Try to parse as URL
          return true;
        } catch {
          return false;
        }
      },
      { message: 'Image must be a valid URL or a local upload path (/uploads/...)' }
    )
    .optional()
    .nullable(),
  language: z.string().length(2).default('fr'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED']).default('DRAFT'),
  publishedAt: z.string().datetime().optional().nullable(),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  keywords: z.array(z.string()).optional(),
});

export const settingsSchema = z.record(z.any());

export const generateArticleSchema = z.object({
  topic: z.string().min(1),
  keywords: z.array(z.string()).optional(),
  language: z.string().length(2).default('fr'),
});

