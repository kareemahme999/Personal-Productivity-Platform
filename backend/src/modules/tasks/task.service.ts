import { Prisma, RecurrenceFrequency, Task, TaskPriority, TaskStatus } from '@prisma/client';
import { addMonths } from 'date-fns';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { DEFAULT_HORIZON_MONTHS, generateOccurrences, toUtcDate } from './recurring.service';
import type { CreateTaskInput, UpdateTaskInput } from './task.validation';

const HORIZON = () => toUtcDate(addMonths(new Date(), DEFAULT_HORIZON_MONTHS));

function parseIsoDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return toUtcDate(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00.000Z`);
  }
  return toUtcDate(new Date(value));
}

function toPrismaDates(input: { startDate?: unknown; dueDate?: unknown; recurrenceEndDate?: unknown }) {
  return {
    startDate: parseIsoDate(input.startDate as string | undefined),
    dueDate: parseIsoDate(input.dueDate as string | undefined),
    recurrenceEndDate: parseIsoDate(input.recurrenceEndDate as string | undefined),
  };
}

async function findOwned(id: string, userId: string, opts?: { includeTemplate?: boolean }) {
  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) throw ApiError.notFound('Task');
  return task;
}

export async function listTasks(
  userId: string,
  filters: {
    status?: TaskStatus;
    priority?: TaskPriority;
    categoryId?: string;
    q?: string;
    dueFrom?: Date | null;
    dueTo?: Date | null;
    completed?: boolean;
    page: number;
    limit: number;
  },
) {
  const { status, priority, categoryId, q, dueFrom, dueTo, completed, page, limit } = filters;

  // Materialize recurring occurrences up to the requested horizon so the list
  // always reflects the real schedule (no stale/broken duplicates).
  if (dueTo || (!dueFrom && !dueTo)) {
    const upTo = dueTo ?? HORIZON();
    const templates = await prisma.task.findMany({
      where: { userId, seriesId: null, recurrence: { not: 'NONE' } },
      select: { id: true },
    });
    await Promise.all(templates.map((t) => generateOccurrences(userId, t.id, upTo)));
  }

  const and: Prisma.TaskWhereInput[] = [
    // Concrete tasks only: occurrences of a series, or single (non-recurring) tasks.
    { OR: [{ seriesId: { not: null } }, { recurrence: 'NONE' }] },
    ...(status ? [{ status }] : []),
    ...(priority ? [{ priority }] : []),
    ...(categoryId ? [{ categoryId }] : []),
    ...(completed !== undefined
      ? [{ status: completed ? ('COMPLETED' as TaskStatus) : ({ not: 'COMPLETED' as TaskStatus } as const) }]
      : []),
    ...(q
      ? [
          {
            OR: [
              { title: { contains: q, mode: Prisma.QueryMode.insensitive } },
              { description: { contains: q, mode: Prisma.QueryMode.insensitive } },
              { notes: { contains: q, mode: Prisma.QueryMode.insensitive } },
            ],
          } as Prisma.TaskWhereInput,
        ]
      : []),
  ];

  const dateCondition: Prisma.TaskWhereInput | undefined =
    dueFrom && dueTo
      ? { OR: [{ dueDate: { gte: dueFrom, lte: dueTo } }, { dueDate: null, startDate: { gte: dueFrom, lte: dueTo } }] }
      : dueFrom
        ? { OR: [{ dueDate: { gte: dueFrom } }, { dueDate: null, startDate: { gte: dueFrom } }] }
        : dueTo
          ? { OR: [{ dueDate: { lte: dueTo } }, { dueDate: null, startDate: { lte: dueTo } }] }
          : undefined;

  if (dateCondition) and.push(dateCondition);

  const where: Prisma.TaskWhereInput = { userId, AND: and };

  const [total, tasks] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { startDate: 'asc' }, { priority: 'desc' }, { createdAt: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
      include: { category: true, attachments: { select: { id: true, fileName: true, fileSize: true, mimeType: true } } },
    }),
  ]);

  return { tasks, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } };
}

export async function getTask(userId: string, id: string) {
  const task = await prisma.task.findFirst({
    where: { id, userId },
    include: { category: true, attachments: true },
  });
  if (!task) throw ApiError.notFound('Task');

  if (task.seriesId === null && task.recurrence !== 'NONE') {
    const occurrences = await prisma.task.findMany({
      where: { seriesId: task.id, userId },
      orderBy: { occurrenceIndex: 'asc' },
    });
    return { task, occurrences };
  }
  return { task, occurrences: null };
}

export async function createTask(userId: string, input: CreateTaskInput) {
  const dates = toPrismaDates(input);
  const recurrence = (input.recurrence ?? 'NONE') as RecurrenceFrequency;

  const base = {
    userId,
    title: input.title.trim(),
    description: input.description ?? null,
    categoryId: input.categoryId ?? null,
    priority: (input.priority ?? 'MEDIUM') as TaskPriority,
    status: (input.status ?? 'PENDING') as TaskStatus,
    startDate: dates.startDate,
    dueDate: dates.dueDate,
    startTime: input.startTime ?? null,
    endTime: input.endTime ?? null,
    notes: input.notes ?? null,
    links: (input.links ?? []) as unknown as Prisma.InputJsonValue,
  };

  if (recurrence !== 'NONE') {
    const template = await prisma.task.create({
      data: {
        ...base,
        recurrence,
        recurrenceInterval: Math.max(1, input.recurrenceInterval ?? 1),
        recurrenceEndDate: dates.recurrenceEndDate,
      },
    });
    const occurrences = await generateOccurrences(userId, template.id, dates.recurrenceEndDate ?? HORIZON(), {
      startDate: dates.startDate ?? undefined,
      dueDate: dates.dueDate ?? undefined,
    });
    return { task: template, occurrences };
  }

  const task = await prisma.task.create({ data: base });
  return { task, occurrences: null };
}

export async function updateTask(userId: string, id: string, input: UpdateTaskInput) {
  const task = await findOwned(id, userId);
  const applyTo = input.applyTo ?? (task.seriesId ? 'this' : 'this');

  if (task.seriesId && applyTo === 'series') {
    return updateSeries(userId, task, input);
  }

  if (task.seriesId === null && task.recurrence !== 'NONE') {
    return updateSeries(userId, task, input);
  }

  const dates = toPrismaDates(input);
  const updated = await prisma.task.update({
    where: { id },
    data: {
      title: input.title !== undefined ? input.title.trim() : undefined,
      description: input.description,
      categoryId: input.categoryId,
      priority: input.priority,
      status: input.status,
      startDate: dates.startDate,
      dueDate: dates.dueDate,
      startTime: input.startTime,
      endTime: input.endTime,
      notes: input.notes,
      links: input.links !== undefined ? (input.links as unknown as Prisma.InputJsonValue) : undefined,
      recurrence: input.recurrence,
      recurrenceInterval: input.recurrenceInterval,
      recurrenceEndDate: dates.recurrenceEndDate,
      ...(input.status === 'COMPLETED' ? { completedAt: new Date() } : {}),
      ...(input.status !== undefined && input.status !== 'COMPLETED' ? { completedAt: null } : {}),
    },
    include: { category: true },
  });
  return { task: updated, occurrences: null };
}

async function updateSeries(userId: string, template: Task, input: UpdateTaskInput) {
  const dates = toPrismaDates(input);

  // Schedule-affecting changes rebuild the future occurrences.
  const scheduleChanged =
    input.recurrence !== undefined ||
    input.recurrenceInterval !== undefined ||
    input.recurrenceEndDate !== undefined ||
    input.startDate !== undefined ||
    input.dueDate !== undefined;

  const updatedTemplate = await prisma.task.update({
    where: { id: template.id },
    data: {
      title: input.title !== undefined ? input.title.trim() : undefined,
      description: input.description,
      categoryId: input.categoryId,
      priority: input.priority,
      status: input.status,
      startDate: dates.startDate,
      dueDate: dates.dueDate,
      startTime: input.startTime,
      endTime: input.endTime,
      notes: input.notes,
      links: input.links !== undefined ? (input.links as unknown as Prisma.InputJsonValue) : undefined,
      recurrence: input.recurrence,
      recurrenceInterval: input.recurrenceInterval,
      recurrenceEndDate: dates.recurrenceEndDate,
    },
  });

  if (scheduleChanged) {
    // Remove all future (non-completed) occurrences and rebuild from the anchor.
    await prisma.task.deleteMany({
      where: { seriesId: template.id, userId, status: { not: 'COMPLETED' } },
    });
    const anchor = dates.startDate ?? template.startDate;
    const anchorDue = dates.dueDate ?? template.dueDate ?? anchor;
    const occurrences = await generateOccurrences(
      userId,
      template.id,
      updatedTemplate.recurrenceEndDate ?? HORIZON(),
      { startDate: anchor ?? undefined, dueDate: anchorDue ?? undefined },
    );
    return { task: updatedTemplate, occurrences };
  }

  // Metadata-only change: propagate to every non-completed occurrence.
  await prisma.task.updateMany({
    where: { seriesId: template.id, userId, status: { not: 'COMPLETED' } },
    data: {
      title: input.title !== undefined ? input.title.trim() : undefined,
      description: input.description,
      categoryId: input.categoryId,
      priority: input.priority,
      startTime: input.startTime,
      endTime: input.endTime,
      notes: input.notes,
      links: input.links !== undefined ? (input.links as unknown as Prisma.InputJsonValue) : undefined,
    },
  });

  const occurrences = await prisma.task.findMany({ where: { seriesId: template.id, userId }, orderBy: { occurrenceIndex: 'asc' } });
  return { task: updatedTemplate, occurrences };
}

export async function setCompleted(userId: string, id: string, completed: boolean) {
  const task = await findOwned(id, userId);

  const updated = await prisma.task.update({
    where: { id },
    data: completed
      ? { status: 'COMPLETED', completedAt: new Date() }
      : { status: 'PENDING', completedAt: null },
  });

  // For a recurring occurrence, materialize the next occurrence after completion.
  if (completed && task.seriesId) {
    await generateOccurrences(task.userId, task.seriesId, HORIZON());
  }

  return updated;
}

export async function deleteTask(userId: string, id: string, mode: 'this' | 'series' = 'this') {
  const task = await findOwned(id, userId);

  const isTemplate = task.seriesId === null && task.recurrence !== 'NONE';
  const isOccurrence = Boolean(task.seriesId);

  if (isTemplate) {
    await prisma.task.deleteMany({ where: { OR: [{ id: task.id }, { seriesId: task.id }], userId } });
    return { deleted: true, series: true };
  }

  if (isOccurrence && mode === 'series') {
    const templateId = task.seriesId!;
    const template = await prisma.task.findFirst({ where: { id: templateId, userId } });
    if (template) {
      await prisma.task.deleteMany({ where: { OR: [{ id: templateId }, { seriesId: templateId }], userId } });
      return { deleted: true, series: true };
    }
    await prisma.task.delete({ where: { id } });
    return { deleted: true, series: false };
  }

  await prisma.task.delete({ where: { id } });
  return { deleted: true, series: false };
}
