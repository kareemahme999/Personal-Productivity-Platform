import { Prisma, ResourceType } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { env } from '../../config/env';

export interface ResourceInput {
  title: string;
  description?: string | null;
  url?: string | null;
  type?: ResourceType;
  categoryId?: string | null;
}

async function findOwned(id: string, userId: string) {
  const resource = await prisma.resource.findFirst({ where: { id, userId } });
  if (!resource) throw ApiError.notFound('Resource');
  return resource;
}

export async function listResources(
  userId: string,
  filters: { type?: ResourceType; categoryId?: string; q?: string; page: number; limit: number },
) {
  const { type, categoryId, q, page, limit } = filters;
  const where: Prisma.ResourceWhereInput = {
    userId,
    ...(type ? { type } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { url: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, resources] = await Promise.all([
    prisma.resource.count({ where }),
    prisma.resource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { category: true },
    }),
  ]);

  return { resources, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } };
}

export async function createResource(userId: string, input: ResourceInput, file?: { filename: string; originalname: string; mimetype: string; size: number }) {
  if (file) {
    return prisma.resource.create({
      data: {
        userId,
        title: input.title.trim(),
        description: input.description ?? null,
        url: input.url ?? null,
        type: ResourceType.FILE,
        categoryId: input.categoryId ?? null,
        fileName: file.originalname,
        filePath: `${env.UPLOAD_DIR}/files/${file.filename}`,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    });
  }
  return prisma.resource.create({
    data: {
      userId,
      title: input.title.trim(),
      description: input.description ?? null,
      url: input.url ?? null,
      type: (input.type ?? 'LINK') as ResourceType,
      categoryId: input.categoryId ?? null,
    },
  });
}

export async function updateResource(id: string, userId: string, input: Partial<ResourceInput>, file?: { filename: string; originalname: string; mimetype: string; size: number }) {
  const resource = await findOwned(id, userId);
  return prisma.resource.update({
    where: { id },
    data: {
      title: input.title !== undefined ? input.title.trim() : undefined,
      description: input.description,
      url: input.url,
      type: input.type,
      categoryId: input.categoryId,
      ...(file
        ? {
            type: ResourceType.FILE,
            fileName: file.originalname,
            filePath: `${env.UPLOAD_DIR}/files/${file.filename}`,
            fileSize: file.size,
            mimeType: file.mimetype,
          }
        : {}),
    },
  });
}

export async function deleteResource(id: string, userId: string) {
  const resource = await findOwned(id, userId);
  if (resource.filePath) {
    try {
      const full = path.resolve(process.cwd(), resource.filePath);
      if (fs.existsSync(full)) fs.unlinkSync(full);
    } catch {
      // Best-effort cleanup; the DB record is the source of truth.
    }
  }
  await prisma.resource.delete({ where: { id } });
}
