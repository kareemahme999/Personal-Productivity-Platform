import { RecurrenceFrequency, Task } from '@prisma/client';
import { addDays, addMonths, addWeeks, addYears } from 'date-fns';
import { prisma } from '../../lib/prisma';

export const DEFAULT_HORIZON_MONTHS = 3;
export const MAX_OCCURRENCES = 60;

function addFrequency(date: Date, frequency: RecurrenceFrequency, interval: number, n: number): Date {
  const offset = interval * n;
  switch (frequency) {
    case 'DAILY':
      return addDays(date, offset);
    case 'WEEKLY':
      return addWeeks(date, offset);
    case 'MONTHLY':
      return addMonths(date, offset);
    case 'YEARLY':
      return addYears(date, offset);
    default:
      return date;
  }
}

function toUtcMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export interface OccurrenceSeed {
  startDate?: Date;
  dueDate?: Date;
}

/**
 * Generate (materialize) concrete occurrences for a recurring-task series up to
 * `upTo`. Occurrences are real Task rows linked to the template via seriesId,
 * each with an occurrenceIndex. Already-existing indices are never duplicated.
 */
export async function generateOccurrences(
  userId: string,
  seriesId: string,
  upTo: Date,
  seed?: OccurrenceSeed,
): Promise<Task[]> {
  const template = await prisma.task.findFirst({
    where: { id: seriesId, userId, seriesId: null },
  });

  if (!template || template.recurrence === 'NONE') return [];

  const interval = Math.max(1, template.recurrenceInterval ?? 1);
  const frequency = template.recurrence as RecurrenceFrequency;

  // Anchor dates: explicit seed > template start/due date > today.
  // Recurring templates can have only a dueDate (no startDate), so we must use
  // that date as the first occurrence anchor instead of falling to the current day.
  const anchorStart = seed?.startDate ?? template.startDate ?? template.dueDate ?? toUtcMidnight(new Date());
  const anchorDue = seed?.dueDate ?? template.dueDate ?? anchorStart;

  // Find the highest index already materialized.
  const latest = await prisma.task.findFirst({
    where: { seriesId, userId },
    orderBy: { occurrenceIndex: 'desc' },
    select: { occurrenceIndex: true },
  });
  let nextIndex = (latest?.occurrenceIndex ?? -1) + 1;

  const created: Task[] = [];
  const endDate = template.recurrenceEndDate ? new Date(template.recurrenceEndDate) : null;

  while (nextIndex < MAX_OCCURRENCES) {
    const n = nextIndex;
    const occStart = addFrequency(anchorStart, frequency, interval, n);
    const occDue = addFrequency(anchorDue, frequency, interval, n);

    if (endDate && occStart > endDate) break;
    if (occStart > upTo && occDue > upTo) break;

    created.push(
      await prisma.task.create({
        data: {
          userId,
          seriesId,
          occurrenceIndex: n,
          title: template.title,
          description: template.description,
          priority: template.priority,
          status: 'PENDING',
          categoryId: template.categoryId,
          startDate: toUtcMidnight(occStart),
          dueDate: occDue ? toUtcMidnight(occDue) : null,
          startTime: template.startTime,
          endTime: template.endTime,
          notes: template.notes,
          links: template.links ?? [],
          recurrence: 'NONE',
          recurrenceInterval: 1,
        },
      }),
    );
    nextIndex += 1;
  }

  return created;
}

export function toUtcDate(value: Date): Date {
  return toUtcMidnight(value);
}

export async function ensureSeriesUpTo(seriesId: string, upTo: Date): Promise<Task[]> {
  const template = await prisma.task.findFirst({ where: { id: seriesId, seriesId: null } });
  if (!template) return [];
  return generateOccurrences(template.userId, seriesId, upTo);
}
