import { z } from 'zod';

export const createWordSchema = z.object({
  word: z.string().trim().min(1, 'Word is required').max(120),
  meaning: z.string().trim().min(1, 'Meaning is required').max(500),
  exampleSentence: z.string().trim().max(1000).optional().nullable(),
  pronunciation: z.string().trim().max(120).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  category: z.string().trim().max(80).optional().nullable(),
  isFavorite: z.boolean().optional(),
  isLearned: z.boolean().optional(),
});

export const updateWordSchema = createWordSchema.partial();

export const listWordsSchema = z.object({
  q: z.string().trim().max(255).optional(),
  category: z.string().trim().max(80).optional(),
  favorite: z
    .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === true || v === 'true' || v === '1')),
  learned: z
    .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === true || v === 'true' || v === '1')),
  random: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type ListWordsQuery = z.infer<typeof listWordsSchema>;

export const wordIdSchema = z.object({ id: z.string().uuid() });

export const quizQuestionsSchema = z.object({
  count: z.coerce.number().int().min(1).max(50).default(10),
  mode: z.enum(['all', 'learned', 'unlearned', 'favorites']).default('all'),
});

export const submitQuizSchema = z.object({
  totalQuestions: z.number().int().min(1).max(100),
  correctAnswers: z.number().int().min(0),
  wrongAnswers: z.number().int().min(0),
  details: z.array(
    z.object({
      wordId: z.string().uuid(),
      word: z.string(),
      givenAnswer: z.string(),
      correct: z.boolean(),
      type: z.enum(['to_arabic', 'to_english']),
    }),
  ),
});
