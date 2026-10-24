import { Prisma, RecurrenceFrequency, TaskPriority, TaskStatus } from '@prisma/client';
import { z } from 'zod';

export const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export const statusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']);
export const recurrenceEnum = z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']);

const isoDate = z.union([z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]);

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255),
  description: z.string().trim().max(5000).optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  priority: priorityEnum.optional(),
  status: statusEnum.optional(),
  startDate: isoDate.optional().nullable(),
  dueDate: isoDate.optional().nullable(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time (HH:mm)').optional().nullable(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time (HH:mm)').optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  links: z.array(z.string().url('Invalid URL').max(2000)).max(20).optional(),
  recurrence: recurrenceEnum.optional(),
  recurrenceInterval: z.number().int().min(1).max(365).optional(),
  recurrenceEndDate: isoDate.optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  applyTo: z.enum(['this', 'series']).optional(),
});

export const completeTaskSchema = z.object({
  completed: z.boolean().optional(),
});

export const listTasksSchema = z.object({
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  categoryId: z.string().uuid().optional(),
  q: z.string().trim().max(255).optional(),
  dueFrom: isoDate.optional(),
  dueTo: isoDate.optional(),
  completed: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  includeSeries: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksSchema>;
