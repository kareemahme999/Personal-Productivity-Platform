import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional().nullable(),
  color: z.string().trim().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, 'Invalid color').optional(),
});

export const updateCategorySchema = createCategorySchema.partial();
