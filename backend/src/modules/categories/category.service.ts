import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';

export interface CategoryInput {
  name: string;
  description?: string | null;
  color?: string;
}

async function findOwned(id: string, userId: string) {
  const category = await prisma.category.findFirst({ where: { id, userId } });
  if (!category) throw ApiError.notFound('Category');
  return category;
}

export async function listCategories(userId: string) {
  return prisma.category.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { tasks: true, resources: true } } },
  });
}

export async function createCategory(userId: string, input: CategoryInput) {
  try {
    return await prisma.category.create({
      data: { userId, name: input.name.trim(), description: input.description ?? null, color: input.color ?? '#8b5cf6' },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw ApiError.conflict('A category with this name already exists');
    }
    throw error;
  }
}

export async function updateCategory(id: string, userId: string, input: Partial<CategoryInput>) {
  await findOwned(id, userId);
  try {
    return await prisma.category.update({
      where: { id },
      data: {
        name: input.name !== undefined ? input.name.trim() : undefined,
        description: input.description,
        color: input.color,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw ApiError.conflict('A category with this name already exists');
    }
    throw error;
  }
}

export async function deleteCategory(id: string, userId: string) {
  await findOwned(id, userId);
  await prisma.category.delete({ where: { id } });
}
