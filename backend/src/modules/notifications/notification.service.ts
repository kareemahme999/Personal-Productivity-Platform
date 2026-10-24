import { endOfDay, startOfDay, addDays } from 'date-fns';
import { prisma } from '../../lib/prisma';

/**
 * Reminder engine. Computes task reminders directly from the database.
 * Designed so a future scheduler can consume these groups and dispatch
 * email/push notifications without changing this contract.
 */
export async function getReminders(userId: string) {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const tomorrowStart = addDays(todayStart, 1);
  const tomorrowEnd = addDays(todayEnd, 1);
  const sevenDaysStart = addDays(todayStart, 7);

  const baseWhere = { userId, status: { not: 'COMPLETED' } as const };

  const [dueToday, dueTomorrow, upcoming, overdue] = await Promise.all([
    prisma.task.findMany({
      where: { ...baseWhere, OR: [{ dueDate: { gte: todayStart, lte: todayEnd } }, { dueDate: null, startDate: { gte: todayStart, lte: todayEnd } }] },
      orderBy: { dueDate: 'asc' },
      include: { category: true },
    }),
    prisma.task.findMany({
      where: { ...baseWhere, OR: [{ dueDate: { gte: tomorrowStart, lte: tomorrowEnd } }, { dueDate: null, startDate: { gte: tomorrowStart, lte: tomorrowEnd } }] },
      orderBy: { dueDate: 'asc' },
      include: { category: true },
    }),
    prisma.task.findMany({
      where: { ...baseWhere, dueDate: { gte: tomorrowStart, lte: sevenDaysStart } },
      orderBy: { dueDate: 'asc' },
      take: 10,
      include: { category: true },
    }),
    prisma.task.findMany({
      where: { ...baseWhere, dueDate: { lt: todayStart } },
      orderBy: { dueDate: 'asc' },
      take: 20,
      include: { category: true },
    }),
  ]);

  return {
    summary: {
      dueToday: dueToday.length,
      dueTomorrow: dueTomorrow.length,
      upcoming: upcoming.length,
      overdue: overdue.length,
    },
    dueToday,
    dueTomorrow,
    upcoming,
    overdue,
  };
}
