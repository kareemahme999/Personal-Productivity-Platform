import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';

export async function globalSearch(userId: string, q: string, types?: string[], limit = 5) {
  const query = q.trim();
  if (query.length < 2) {
    throw ApiError.badRequest('Search query must be at least 2 characters');
  }

  const requested = types && types.length > 0 ? new Set(types) : new Set(['tasks', 'resources', 'words', 'goals']);
  const take = Math.min(limit, 20);

  const results: Record<string, unknown> = { query };

  if (requested.has('tasks')) {
    const [items, total] = await Promise.all([
      prisma.task.findMany({
        where: {
          userId,
          status: { not: 'COMPLETED' },
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { notes: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { dueDate: 'asc' },
        take,
        include: { category: true },
      }),
      prisma.task.count({
        where: {
          userId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { notes: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);
    results.tasks = { items, total };
  }

  if (requested.has('resources')) {
    const [items, total] = await Promise.all([
      prisma.resource.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { url: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take,
      }),
      prisma.resource.count({
        where: {
          userId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { url: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);
    results.resources = { items, total };
  }

  if (requested.has('words')) {
    const [items, total] = await Promise.all([
      prisma.englishWord.findMany({
        where: {
          userId,
          OR: [
            { word: { contains: query, mode: 'insensitive' } },
            { meaning: { contains: query, mode: 'insensitive' } },
            { exampleSentence: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take,
      }),
      prisma.englishWord.count({
        where: {
          userId,
          OR: [
            { word: { contains: query, mode: 'insensitive' } },
            { meaning: { contains: query, mode: 'insensitive' } },
            { exampleSentence: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);
    results.words = { items, total };
  }

  if (requested.has('goals')) {
    const [items, total] = await Promise.all([
      prisma.goal.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take,
      }),
      prisma.goal.count({
        where: {
          userId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);
    results.goals = { items, total };
  }

  return results;
}
