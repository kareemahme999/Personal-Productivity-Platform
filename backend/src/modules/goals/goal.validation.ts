import { z } from 'zod';

export const goalStatusEnum = z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']);

export const createGoalSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255),
  description: z.string().trim().max(5000).optional().nullable(),
  deadline: z.union([z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional().nullable(),
  progress: z.number().int().min(0).max(100).optional(),
  status: goalStatusEnum.optional(),
  category: z.string().trim().max(80).optional().nullable(),
});

export const updateGoalSchema = createGoalSchema.partial();

export const listGoalsSchema = z.object({
  status: goalStatusEnum.optional(),
  q: z.string().trim().max(255).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});
