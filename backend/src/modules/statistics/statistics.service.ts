import { startOfDay, subDays, endOfDay } from 'date-fns';
import { prisma } from '../../lib/prisma';

function utcDayStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function utcDayEnd(d: Date): Date {
  const start = utcDayStart(d);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

async function computeStreaks(userId: string): Promise<{ current: number; longest: number }> {
  const completed = await prisma.task.findMany({
    where: { userId, status: 'COMPLETED', completedAt: { not: null } },
    select: { completedAt: true },
  });

  const daySet = new Set<number>();
  for (const t of completed) {
    daySet.add(utcDayStart(t.completedAt!).getTime());
  }

  const days = [...daySet].sort((a, b) => a - b);
  if (days.length === 0) return { current: 0, longest: 0 };

  // Longest streak.
  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i += 1) {
    if (days[i] - days[i - 1] === 86400000) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  // Current streak: count back from today (or yesterday if today has none yet).
  let current = 0;
  let cursor = utcDayStart(new Date());
  if (!daySet.has(cursor.getTime())) {
    cursor = subDays(cursor, 1);
  }
  while (daySet.has(cursor.getTime())) {
    current += 1;
    cursor = subDays(cursor, 1);
  }

  return { current, longest };
}

export async function dashboard(userId: string) {
  const today = utcDayStart(new Date());
  const tomorrow = new Date(today.getTime() + 86400000);
  const weekAhead = new Date(today.getTime() + 7 * 86400000);
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [
    todayTasks,
    completedToday,
    pendingCount,
    overdueCount,
    totalTasks,
    completedTasks,
    activeGoals,
    completedGoals,
    upcoming,
    recentResources,
    recentWords,
    totalWords,
    learnedWords,
    favoriteWords,
    quizAttempts,
    streaks,
  ] = await Promise.all([
    prisma.task.count({
      where: { userId, OR: [{ dueDate: { gte: today, lte: endOfDay(today) } }, { dueDate: null, startDate: { gte: today, lte: endOfDay(today) } }] },
    }),
    prisma.task.count({ where: { userId, status: 'COMPLETED', completedAt: { gte: todayStart, lte: todayEnd } } }),
    prisma.task.count({ where: { userId, status: { not: 'COMPLETED' } } }),
    prisma.task.count({ where: { userId, dueDate: { lt: today }, status: { not: 'COMPLETED' } } }),
    prisma.task.count({ where: { userId } }),
    prisma.task.count({ where: { userId, status: 'COMPLETED' } }),
    prisma.goal.count({ where: { userId, status: 'ACTIVE' } }),
    prisma.goal.count({ where: { userId, status: 'COMPLETED' } }),
    prisma.task.findMany({
      where: { userId, status: { not: 'COMPLETED' }, dueDate: { gte: today, lte: weekAhead } },
      orderBy: { dueDate: 'asc' },
      take: 5,
      include: { category: true },
    }),
    prisma.resource.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.englishWord.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.englishWord.count({ where: { userId } }),
    prisma.englishWord.count({ where: { userId, isLearned: true } }),
    prisma.englishWord.count({ where: { userId, isFavorite: true } }),
    prisma.quizAttempt.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
    computeStreaks(userId),
  ]);

  return {
    tasks: {
      todayTasks,
      completedToday,
      pending: pendingCount,
      overdue: overdueCount,
      total: totalTasks,
      completed: completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 1000) / 10 : 0,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
    },
    goals: { active: activeGoals, completed: completedGoals },
    upcomingDeadlines: upcoming,
    recentResources,
    recentWords,
    vocabulary: {
      total: totalWords,
      learned: learnedWords,
      favorites: favoriteWords,
      learningProgress: totalWords > 0 ? Math.round((learnedWords / totalWords) * 1000) / 10 : 0,
    },
    quiz: quizAttempts,
  };
}

export async function taskStats(userId: string) {
  const today = utcDayStart(new Date());
  const thirtyDaysAgo = subDays(today, 29);

  const [byStatus, byPriority, byCategory, daily] = await Promise.all([
    prisma.task.groupBy({ by: ['status'], where: { userId }, _count: { _all: true } }),
    prisma.task.groupBy({ by: ['priority'], where: { userId }, _count: { _all: true } }),
    prisma.task.groupBy({ by: ['categoryId'], where: { userId }, _count: { _all: true } }),
    prisma.task.findMany({
      where: { userId, status: 'COMPLETED', completedAt: { gte: thirtyDaysAgo } },
      select: { completedAt: true },
    }),
  ]);

  const dayMap: Record<string, number> = {};
  for (let i = 0; i < 30; i += 1) {
    const d = subDays(today, 29 - i);
    dayMap[utcDayStart(d).toISOString().slice(0, 10)] = 0;
  }
  for (const t of daily) {
    if (!t.completedAt) continue;
    const key = utcDayStart(t.completedAt).toISOString().slice(0, 10);
    if (key in dayMap) dayMap[key] += 1;
  }

  const categories = await prisma.category.findMany({
    where: { userId },
    select: { id: true, name: true, color: true },
  });

  return {
    byStatus,
    byPriority,
    byCategory: byCategory.map((c) => ({
      categoryId: c.categoryId,
      name: categories.find((x) => x.id === c.categoryId)?.name ?? 'Uncategorized',
      color: categories.find((x) => x.id === c.categoryId)?.color ?? '#94a3b8',
      count: c._count._all,
    })),
    dailyCompletion: Object.entries(dayMap).map(([date, count]) => ({ date, count })),
  };
}

export async function productivity(userId: string) {
  const today = utcDayStart(new Date());
  const todayEnd = endOfDay(new Date());

  const [weekly, monthly, yearly, allTime, streaks] = await Promise.all([
    prisma.task.count({ where: { userId, status: 'COMPLETED', completedAt: { gte: utcDayStart(today), lte: todayEnd } } }),
    prisma.task.count({ where: { userId, status: 'COMPLETED', completedAt: { gte: subDays(today, 29), lte: todayEnd } } }),
    prisma.task.count({ where: { userId, status: 'COMPLETED', completedAt: { gte: subDays(today, 365), lte: todayEnd } } }),
    prisma.task.count({ where: { userId, status: 'COMPLETED' } }),
    computeStreaks(userId),
  ]);

  // 8-week productivity trend.
  const weeklyTrend: { label: string; completed: number; created: number }[] = [];
  for (let w = 7; w >= 0; w -= 1) {
    const weekStart = subDays(today, w * 7);
    const weekEnd = new Date(weekStart.getTime() + 6 * 86400000 + 24 * 60 * 60 * 1000 - 1);
    const [completed, created] = await Promise.all([
      prisma.task.count({ where: { userId, status: 'COMPLETED', completedAt: { gte: weekStart, lte: weekEnd } } }),
      prisma.task.count({ where: { userId, createdAt: { gte: weekStart, lte: weekEnd } } }),
    ]);
    weeklyTrend.push({
      label: `Week ${new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      completed,
      created,
    });
  }

  return {
    today: weekly,
    last30Days: monthly,
    last365Days: yearly,
    allTime,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    weeklyTrend,
  };
}

export async function vocabularyStats(userId: string) {
  const [total, learned, favorites, learnedThisWeek, attempts] = await Promise.all([
    prisma.englishWord.count({ where: { userId } }),
    prisma.englishWord.count({ where: { userId, isLearned: true } }),
    prisma.englishWord.count({ where: { userId, isFavorite: true } }),
    prisma.englishWord.count({ where: { userId, isLearned: true, updatedAt: { gte: subDays(new Date(), 7) } } }),
    prisma.quizAttempt.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
  ]);

  const attemptCount = attempts.length;
  const avgScore =
    attemptCount > 0 ? attempts.reduce((sum, a) => sum + a.scorePercent, 0) / attemptCount : 0;

  const recent = attempts.slice(-10).map((a) => ({
    date: a.createdAt,
    score: a.scorePercent,
    correct: a.correctAnswers,
    total: a.totalQuestions,
  }));

  return {
    total,
    learned,
    favorites,
    unlearned: Math.max(0, total - learned),
    learnedThisWeek,
    learningProgress: total > 0 ? Math.round((learned / total) * 1000) / 10 : 0,
    quiz: { attemptCount, avgScore: Math.round(avgScore * 100) / 100, bestScore: attemptCount ? Math.max(...attempts.map((a) => a.scorePercent)) : 0, recent },
  };
}
