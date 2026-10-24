import { z } from 'zod';

export const resourceTypeEnum = z.enum(['LINK', 'FILE', 'NOTE']);

const baseResourceSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255),
  description: z.string().trim().max(5000).optional().nullable(),
  url: z.string().url('Invalid URL').max(2000).optional().nullable(),
  type: resourceTypeEnum.optional(),
  categoryId: z.string().uuid().optional().nullable(),
});

export const createResourceSchema = baseResourceSchema.superRefine((data, ctx) => {
  if ((data.type ?? 'LINK') === 'LINK' && !data.url) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['url'], message: 'A URL is required for link resources' });
  }
});

export const updateResourceSchema = baseResourceSchema.partial();

export const listResourcesSchema = z.object({
  type: resourceTypeEnum.optional(),
  categoryId: z.string().uuid().optional(),
  q: z.string().trim().max(255).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
