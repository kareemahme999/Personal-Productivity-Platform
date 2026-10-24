import { GoalStatus, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';

export interface GoalInput {
  title: string;
  description?: string | null;
  deadline?: Date | string | null;
  progress?: number;
  status?: GoalStatus;
  category?: string | null;
}

async function findOwned(id: string, userId: string) {
  const goal = await prisma.goal.findFirst({ where: { id, userId } });
  if (!goal) throw ApiError.notFound('Goal');
  return goal;
}

function parseDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00.000Z`);
  return new Date(value);
}

export async function listGoals(userId: string, filters: { status?: GoalStatus; q?: string; page: number; limit: number }) {
  const { status, q, page, limit } = filters;
  const where: Prisma.GoalWhereInput = {
    userId,
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, goals] = await Promise.all([
    prisma.goal.count({ where }),
    prisma.goal.findMany({
      where,
      orderBy: [{ status: 'asc' }, { deadline: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { goals, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } };
}

export async function createGoal(userId: string, input: GoalInput) {
  const progress = input.progress ?? 0;
  return prisma.goal.create({
    data: {
      userId,
      title: input.title.trim(),
      description: input.description ?? null,
      deadline: parseDate(input.deadline),
      progress: Math.min(100, Math.max(0, progress)),
      status: input.status ?? (progress >= 100 ? 'COMPLETED' : 'ACTIVE'),
      category: input.category ?? null,
      completedAt: progress >= 100 ? new Date() : null,
    },
  });
}

export async function updateGoal(id: string, userId: string, input: Partial<GoalInput>) {
  await findOwned(id, userId);

  const progress = input.progress !== undefined ? Math.min(100, Math.max(0, input.progress)) : undefined;
  const status = input.status ?? (progress !== undefined ? (progress >= 100 ? 'COMPLETED' : 'ACTIVE') : undefined);

  return prisma.goal.update({
    where: { id },
    data: {
      title: input.title !== undefined ? input.title.trim() : undefined,
      description: input.description,
      deadline: input.deadline !== undefined ? parseDate(input.deadline) : undefined,
      progress,
      status,
      category: input.category,
      ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
      ...(status !== undefined && status !== 'COMPLETED' ? { completedAt: null } : {}),
    },
  });
}

export async function deleteGoal(id: string, userId: string) {
  await findOwned(id, userId);
  await prisma.goal.delete({ where: { id } });
}
