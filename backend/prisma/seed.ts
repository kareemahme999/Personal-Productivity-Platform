import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_USER = {
  name: 'Aura Demo',
  email: 'demo@aura.app',
  password: 'AuraDemo123',
};

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_USER.password, 12);
  const user = await prisma.user.upsert({
    where: { email: DEMO_USER.email },
    update: {},
    create: {
      name: DEMO_USER.name,
      email: DEMO_USER.email,
      passwordHash,
    },
  });

  // Categories
  const categories = await Promise.all(
    [
      { name: 'Study', color: '#8b5cf6' },
      { name: 'Work', color: '#3b82f6' },
      { name: 'Health', color: '#10b981' },
      { name: 'Personal', color: '#f59e0b' },
      { name: 'Finance', color: '#ef4444' },
    ].map((c) =>
      prisma.category.upsert({
        where: { userId_name: { userId: user.id, name: c.name } },
        update: { color: c.color },
        create: { userId: user.id, ...c },
      }),
    ),
  );

  const study = categories[0];

  // Sample tasks
  const taskTemplates = [
    { title: 'Study Python for 1 hour', description: 'Core programming practice', priority: 'HIGH', startDate: today(-1), dueDate: today(0), recurrence: 'DAILY' },
    { title: 'Review Machine Learning notes', description: 'Linear regression chapter', priority: 'MEDIUM', startDate: today(0), dueDate: today(0) },
    { title: 'Finish project proposal', description: 'Write the summary section', priority: 'URGENT', startDate: today(-1), dueDate: today(1) },
    { title: 'Go for a 30 minute walk', description: 'Morning exercise', priority: 'LOW', startDate: today(0), dueDate: today(0) },
    { title: 'Read 20 pages of clean code', description: 'Chapter 5', priority: 'MEDIUM', startDate: today(1), dueDate: today(2) },
  ] as const;

  for (const t of taskTemplates) {
    const existing = await prisma.task.findFirst({ where: { userId: user.id, title: t.title } });
    if (existing) continue;
    const base = {
      userId: user.id,
      categoryId: study.id,
      title: t.title,
      description: t.description,
      priority: t.priority as 'HIGH' | 'MEDIUM' | 'URGENT' | 'LOW',
      startDate: t.startDate as Date,
      dueDate: t.dueDate as Date,
    };
    if ('recurrence' in t && t.recurrence === 'DAILY') {
      await prisma.task.create({
        data: {
          ...base,
          recurrence: 'DAILY',
          recurrenceInterval: 1,
          recurrenceEndDate: today(30),
          status: 'PENDING',
        },
      });
      // Generate a couple of occurrences so the series is visible.
      for (let i = 0; i < 3; i += 1) {
        await prisma.task.create({
          data: {
            ...base,
            title: t.title,
            seriesId: (await prisma.task.findFirst({ where: { userId: user.id, title: t.title, seriesId: null } }))?.id ?? null,
            occurrenceIndex: i,
            startDate: today(i),
            dueDate: today(i),
            status: 'PENDING',
          },
        });
      }
    } else {
      await prisma.task.create({ data: { ...base, status: 'PENDING' } });
    }
  }

  // Sample resources
  const resources = [
    { title: 'Python Documentation', description: 'Official Python reference', url: 'https://docs.python.org/3/' },
    { title: 'Learn TypeScript', description: 'TypeScript handbook', url: 'https://www.typescriptlang.org/docs/' },
    { title: 'Machine Learning Course', description: 'Andrew Ng Coursera course', url: 'https://www.coursera.org/learn/machine-learning' },
  ];
  for (const r of resources) {
    const existing = await prisma.resource.findFirst({ where: { userId: user.id, title: r.title } });
    if (!existing) {
      await prisma.resource.create({ data: { userId: user.id, ...r, type: 'LINK' } });
    }
  }

  // Sample English words (Arabic meanings)
  const words = [
    { word: 'Improve', meaning: 'يحسن / يطور', exampleSentence: 'I want to improve my English.', pronunciation: '/ɪmˈpruːv/' },
    { word: 'Achieve', meaning: 'يحقق', exampleSentence: 'She achieved her goal.', pronunciation: '/əˈtʃiːv/' },
    { word: 'Consistent', meaning: 'منتظم / ثابت', exampleSentence: 'Be consistent in your studies.', pronunciation: '/kənˈsɪstənt/' },
    { word: 'Efficient', meaning: 'كفؤ / فعّال', exampleSentence: 'This method is very efficient.', pronunciation: '/ɪˈfɪʃnt/' },
    { word: 'Persistent', meaning: 'مثابر', exampleSentence: 'He is persistent in learning.', pronunciation: '/pəˈsɪstənt/' },
    { word: 'Determine', meaning: 'يحدد / يعزم', exampleSentence: 'I am determined to finish this.', pronunciation: '/dɪˈtɜːmɪn/' },
    { word: 'Significant', meaning: 'مهم / ذو شأن', exampleSentence: 'This is a significant improvement.', pronunciation: '/sɪɡˈnɪfɪkənt/' },
    { word: 'Require', meaning: 'يتطلب', exampleSentence: 'This task requires focus.', pronunciation: '/rɪˈkwaɪər/' },
  ];
  for (const w of words) {
    await prisma.englishWord.upsert({
      where: { userId_word: { userId: user.id, word: w.word } },
      update: {},
      create: { userId: user.id, ...w, category: 'General', isLearned: false },
    });
  }

  // Sample goals
  const goals = [
    { title: 'Complete Machine Learning Course', description: 'Finish all modules and the capstone project.', progress: 35 },
    { title: 'Learn 1000 English words', description: 'Master vocabulary with daily review.', progress: 8 },
    { title: 'Run 5 km without stopping', description: 'Build up endurance gradually.', progress: 20 },
  ];
  for (const g of goals) {
    const existing = await prisma.goal.findFirst({ where: { userId: user.id, title: g.title } });
    if (!existing) {
      await prisma.goal.create({
        data: { userId: user.id, title: g.title, description: g.description, progress: g.progress, deadline: today(90) },
      });
    }
  }

  // A few quiz attempts for chart data
  const attempts = await prisma.quizAttempt.count({ where: { userId: user.id } });
  if (attempts === 0) {
    for (const [c, t] of [[3, 5], [4, 5], [5, 8], [7, 10], [6, 10]] as const) {
      await prisma.quizAttempt.create({
        data: {
          userId: user.id,
          totalQuestions: t,
          correctAnswers: c,
          wrongAnswers: t - c,
          scorePercent: Math.round((c / t) * 1000) / 10,
          details: [],
        },
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log('✅ Seed complete.');
  // eslint-disable-next-line no-console
  console.log(`Demo account: ${DEMO_USER.email} / ${DEMO_USER.password}`);
}

function today(offsetDays: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d;
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
