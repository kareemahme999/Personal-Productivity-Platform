import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';

const CSV_TABLES = ['tasks', 'categories', 'resources', 'words', 'goals'] as const;
export type CsvTable = (typeof CSV_TABLES)[number];

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))];
  return lines.join('\r\n');
}

function stripSensitive<T extends { passwordHash?: string }>(rows: T[]): Omit<T, 'passwordHash'>[] {
  return rows.map(({ passwordHash, ...rest }) => rest);
}

export async function exportJson(userId: string) {
  const [user, categories, tasks, resources, words, goals, quizAttempts] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.category.findMany({ where: { userId } }),
    prisma.task.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    prisma.resource.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    prisma.englishWord.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    prisma.quizAttempt.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    user: user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
          profileImage: user.profileImage,
          theme: user.theme,
          createdAt: user.createdAt,
        }
      : null,
    categories,
    tasks,
    resources,
    englishWords: words,
    goals,
    quizAttempts,
  };
}

export async function exportCsv(userId: string, table: CsvTable): Promise<string> {
  switch (table) {
    case 'categories': {
      const rows = await prisma.category.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
      return toCsv(rows);
    }
    case 'tasks': {
      const rows = await prisma.task.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
      return toCsv(rows.map(({ links, ...rest }) => ({ ...rest, links: JSON.stringify(links ?? []) })));
    }
    case 'resources': {
      const rows = await prisma.resource.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
      return toCsv(rows);
    }
    case 'words': {
      const rows = await prisma.englishWord.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
      return toCsv(rows);
    }
    case 'goals': {
      const rows = await prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
      return toCsv(rows);
    }
    default:
      throw ApiError.badRequest('Unsupported table for CSV export');
  }
}

/**
 * Restore data from a previously exported JSON backup. Records that already
 * exist (matched by a natural key) are skipped to avoid duplicates.
 */
export async function restore(userId: string, backup: {
  categories?: Array<{ name: string; description?: string | null; color?: string | null }>;
  tasks?: Array<{ title: string; description?: string | null; priority?: string; status?: string; startDate?: string | Date | null; dueDate?: string | Date | null; notes?: string | null }>;
  resources?: Array<{ title: string; description?: string | null; url?: string | null }>;
  englishWords?: Array<{ word: string; meaning: string; exampleSentence?: string | null; pronunciation?: string | null; notes?: string | null; category?: string | null; isFavorite?: boolean; isLearned?: boolean }>;
  goals?: Array<{ title: string; description?: string | null; deadline?: string | Date | null; progress?: number; status?: string; category?: string | null }>;
}) {
  const result = { categories: 0, tasks: 0, resources: 0, words: 0, goals: 0, skipped: 0 };

  if (Array.isArray(backup.categories)) {
    for (const c of backup.categories) {
      if (!c.name) continue;
      const existing = await prisma.category.findFirst({ where: { userId, name: c.name } });
      if (existing) {
        result.skipped += 1;
        continue;
      }
      await prisma.category.create({
        data: { userId, name: c.name, description: c.description ?? null, color: c.color ?? '#8b5cf6' },
      });
      result.categories += 1;
    }
  }

  if (Array.isArray(backup.englishWords)) {
    for (const w of backup.englishWords) {
      if (!w.word || !w.meaning) continue;
      const existing = await prisma.englishWord.findFirst({ where: { userId, word: w.word } });
      if (existing) {
        result.skipped += 1;
        continue;
      }
      await prisma.englishWord.create({
        data: {
          userId,
          word: w.word,
          meaning: w.meaning,
          exampleSentence: w.exampleSentence ?? null,
          pronunciation: w.pronunciation ?? null,
          notes: w.notes ?? null,
          category: w.category ?? null,
          isFavorite: w.isFavorite ?? false,
          isLearned: w.isLearned ?? false,
        },
      });
      result.words += 1;
    }
  }

  if (Array.isArray(backup.tasks)) {
    for (const t of backup.tasks) {
      if (!t.title) continue;
      await prisma.task.create({
        data: {
          userId,
          title: t.title,
          description: t.description ?? null,
          priority: (t.priority as never) ?? 'MEDIUM',
          status: (t.status as never) ?? 'PENDING',
          startDate: t.startDate ? new Date(t.startDate) : null,
          dueDate: t.dueDate ? new Date(t.dueDate) : null,
          notes: t.notes ?? null,
        },
      });
      result.tasks += 1;
    }
  }

  if (Array.isArray(backup.resources)) {
    for (const r of backup.resources) {
      if (!r.title) continue;
      await prisma.resource.create({
        data: {
          userId,
          title: r.title,
          description: r.description ?? null,
          url: r.url ?? null,
          type: 'LINK',
        },
      });
      result.resources += 1;
    }
  }

  if (Array.isArray(backup.goals)) {
    for (const g of backup.goals) {
      if (!g.title) continue;
      await prisma.goal.create({
        data: {
          userId,
          title: g.title,
          description: g.description ?? null,
          deadline: g.deadline ? new Date(g.deadline) : null,
          progress: Math.min(100, Math.max(0, g.progress ?? 0)),
          status: (g.status as never) ?? 'ACTIVE',
          category: g.category ?? null,
        },
      });
      result.goals += 1;
    }
  }

  return result;
}

export { CSV_TABLES };
