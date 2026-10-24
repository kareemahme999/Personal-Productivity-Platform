import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';

export interface WordInput {
  word: string;
  meaning: string;
  exampleSentence?: string | null;
  pronunciation?: string | null;
  notes?: string | null;
  category?: string | null;
  isFavorite?: boolean;
  isLearned?: boolean;
}

async function findOwned(id: string, userId: string) {
  const word = await prisma.englishWord.findFirst({ where: { id, userId } });
  if (!word) throw ApiError.notFound('Word');
  return word;
}

function handleUnique(error: unknown, word: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    throw ApiError.conflict(`The word "${word}" already exists in your vocabulary`);
  }
  throw error;
}

export async function listWords(
  userId: string,
  filters: { q?: string; category?: string; favorite?: boolean; learned?: boolean; random?: boolean; page: number; limit: number },
) {
  const { q, category, favorite, learned, random, page, limit } = filters;

  if (random) {
    const total = await prisma.englishWord.count({ where: { userId } });
    if (total === 0) return { words: [], pagination: { page, limit, total: 0, pages: 1 } };
    const skip = Math.floor(Math.random() * total);
    const word = await prisma.englishWord.findMany({
      where: { userId },
      skip,
      take: 1,
      orderBy: { id: 'asc' },
    });
    return { words: word, pagination: { page: 1, limit: 1, total, pages: 1 } };
  }

  const where: Prisma.EnglishWordWhereInput = {
    userId,
    ...(q
      ? {
          OR: [
            { word: { contains: q, mode: 'insensitive' } },
            { meaning: { contains: q, mode: 'insensitive' } },
            { exampleSentence: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(category ? { category } : {}),
    ...(favorite !== undefined ? { isFavorite: favorite } : {}),
    ...(learned !== undefined ? { isLearned: learned } : {}),
  };

  const [total, words] = await Promise.all([
    prisma.englishWord.count({ where }),
    prisma.englishWord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { words, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } };
}

export async function createWord(userId: string, input: WordInput) {
  try {
    return await prisma.englishWord.create({
      data: {
        userId,
        word: input.word.trim(),
        meaning: input.meaning.trim(),
        exampleSentence: input.exampleSentence ?? null,
        pronunciation: input.pronunciation ?? null,
        notes: input.notes ?? null,
        category: input.category ?? null,
        isFavorite: input.isFavorite ?? false,
        isLearned: input.isLearned ?? false,
      },
    });
  } catch (error) {
    handleUnique(error, input.word);
  }
}

export async function updateWord(id: string, userId: string, input: Partial<WordInput>) {
  await findOwned(id, userId);
  try {
    return await prisma.englishWord.update({
      where: { id },
      data: {
        word: input.word !== undefined ? input.word.trim() : undefined,
        meaning: input.meaning !== undefined ? input.meaning.trim() : undefined,
        exampleSentence: input.exampleSentence,
        pronunciation: input.pronunciation,
        notes: input.notes,
        category: input.category,
        isFavorite: input.isFavorite,
        isLearned: input.isLearned,
      },
    });
  } catch (error) {
    handleUnique(error, input.word ?? 'word');
  }
}

export async function setLearned(id: string, userId: string, data: { isLearned?: boolean; isFavorite?: boolean }) {
  await findOwned(id, userId);
  return prisma.englishWord.update({
    where: { id },
    data: {
      isLearned: data.isLearned,
      isFavorite: data.isFavorite,
      ...(data.isLearned ? { reviewCount: { increment: 1 } } : {}),
    },
  });
}

export async function deleteWord(id: string, userId: string) {
  await findOwned(id, userId);
  await prisma.englishWord.delete({ where: { id } });
}

export async function getWordOfDay(userId: string) {
  const count = await prisma.englishWord.count({ where: { userId } });
  if (count === 0) return null;
  const dayOffset = Math.floor(Date.now() / 86400000);
  const word = await prisma.englishWord.findMany({
    where: { userId },
    skip: dayOffset % count,
    take: 1,
  });
  return word[0] ?? null;
}

export async function getCategories(userId: string): Promise<string[]> {
  const rows = await prisma.englishWord.findMany({
    where: { userId, category: { not: null } },
    select: { category: true },
    distinct: ['category'],
  });
  return rows.map((r) => r.category!).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------

export interface QuizQuestion {
  wordId: string;
  word: string;
  meaning: string;
  type: 'to_arabic' | 'to_english';
}

export async function generateQuizQuestions(userId: string, count: number, mode: string): Promise<QuizQuestion[]> {
  const where: Prisma.EnglishWordWhereInput = { userId };
  if (mode === 'learned') where.isLearned = true;
  if (mode === 'unlearned') where.isLearned = false;
  if (mode === 'favorites') where.isFavorite = true;

  const total = await prisma.englishWord.count({ where });
  const take = Math.min(count, total);
  if (take === 0) return [];

  // Random sample via random offsets (works well for personal-scale vocabularies).
  const offsets = new Set<number>();
  while (offsets.size < take) {
    offsets.add(Math.floor(Math.random() * total));
  }

  const words = await prisma.englishWord.findMany({
    where,
    orderBy: { id: 'asc' },
    skip: 0,
    take: total,
  });

  const sampled = [...offsets].map((offset) => words[offset]).filter(Boolean);

  return sampled.map((w) => ({
    wordId: w.id,
    word: w.word,
    meaning: w.meaning,
    type: (Math.random() < 0.5 ? 'to_arabic' : 'to_english') as QuizQuestion['type'],
  }));
}

export async function submitQuiz(
  userId: string,
  input: { totalQuestions: number; correctAnswers: number; wrongAnswers: number; details: unknown },
) {
  const scorePercent = input.totalQuestions > 0 ? (input.correctAnswers / input.totalQuestions) * 100 : 0;
  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      totalQuestions: input.totalQuestions,
      correctAnswers: input.correctAnswers,
      wrongAnswers: input.wrongAnswers,
      scorePercent: Math.round(scorePercent * 100) / 100,
      details: input.details as Prisma.InputJsonValue,
    },
  });

  // Bump review count for words that were answered correctly.
  const details = Array.isArray(input.details) ? (input.details as Array<{ wordId: string; correct: boolean }>) : [];
  for (const d of details) {
    if (d.correct && d.wordId) {
      await prisma.englishWord.updateMany({
        where: { id: d.wordId, userId },
        data: { reviewCount: { increment: 1 } },
      });
    }
  }

  return attempt;
}

export async function quizHistory(userId: string, limit = 20) {
  return prisma.quizAttempt.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
