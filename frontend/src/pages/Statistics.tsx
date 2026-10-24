import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell,
  Legend, AreaChart, Area,
} from 'recharts';
import { BarChart3, TrendingUp, Flame } from 'lucide-react';
import { statisticsApi } from '@/api/endpoints';
import type { ProductivityData, TaskStatsData, VocabularyStatsData } from '@/api/endpoints';
import { errorMessage } from '@/api/client';
import { PageHeader, Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Base';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#94a3b8',
  IN_PROGRESS: '#6366f1',
  COMPLETED: '#10b981',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#94a3b8',
  MEDIUM: '#3b82f6',
  HIGH: '#f59e0b',
  URGENT: '#ef4444',
};

const TOOLTIP_STYLE = {
  backgroundColor: '#141a2e',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  fontSize: '12px',
  color: '#e2e8f0',
};

export function StatisticsPage() {
  const { data: tasks, isLoading: loadingTasks, isError: errTasks, error: eTasks } = useQuery<TaskStatsData>({
    queryKey: ['stats-tasks'],
    queryFn: () => statisticsApi.tasks().then((r) => r.data.data),
  });
  const { data: prod, isLoading: loadingProd, isError: errProd, error: eProd } = useQuery<ProductivityData>({
    queryKey: ['stats-productivity'],
    queryFn: () => statisticsApi.productivity().then((r) => r.data.data),
  });
  const { data: vocab, isLoading: loadingVocab, isError: errVocab, error: eVocab } = useQuery<VocabularyStatsData>({
    queryKey: ['stats-vocabulary'],
    queryFn: () => statisticsApi.vocabulary().then((r) => r.data.data),
  });

  const loading = loadingTasks || loadingProd || loadingVocab;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const prodCards = [
    { label: 'Completed today', value: prod?.today ?? 0, icon: TrendingUp, color: 'text-emerald-500 bg-emerald-500/10' },
    { label: 'Last 30 days', value: prod?.last30Days ?? 0, icon: BarChart3, color: 'text-sky-500 bg-sky-500/10' },
    { label: 'All time', value: prod?.allTime ?? 0, icon: Flame, color: 'text-orange-500 bg-orange-500/10' },
    { label: 'Current streak', value: `${prod?.currentStreak ?? 0}d`, icon: Flame, color: 'text-brand-500 bg-brand-500/10' },
  ];

  return (
    <div>
      <PageHeader title="Statistics" subtitle="Insights into your productivity and learning" icon={<BarChart3 className="h-5 w-5" />} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {prodCards.map((s) => (
          <Card key={s.label} className="flex items-center gap-4 !p-4">
            <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', s.color)}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
              <p className="font-display text-2xl font-bold text-slate-800 dark:text-white">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Weekly trend" subtitle="Completed vs created tasks" />
          {errProd ? (
            <p className="text-sm text-red-500">{errorMessage(eProd)}</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={prod?.weeklyTrend ?? []}>
                <defs>
                  <linearGradient id="completed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="created" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="completed" stroke="#8b5cf6" fill="url(#completed)" strokeWidth={2} />
                <Area type="monotone" dataKey="created" stroke="#38bdf8" fill="url(#created)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <CardHeader title="Tasks by status" />
          {errTasks ? (
            <p className="text-sm text-red-500">{errorMessage(eTasks)}</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={(tasks?.byStatus ?? []).map((s) => ({ name: s.status.replace('_', ' '), value: s._count._all }))}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {(tasks?.byStatus ?? []).map((s) => (
                    <Cell key={s.status} fill={STATUS_COLORS[s.status]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <CardHeader title="Daily completions" subtitle="Last 30 days" />
          {errTasks ? (
            <p className="text-sm text-red-500">{errorMessage(eTasks)}</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={(tasks?.dailyCompletion ?? []).map((d) => ({ label: d.date.slice(5), count: d.count }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} interval={3} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" name="Completed" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <CardHeader title="Tasks by priority" />
          {errTasks ? (
            <p className="text-sm text-red-500">{errorMessage(eTasks)}</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={(tasks?.byPriority ?? []).map((p) => ({ name: p.priority, value: p._count._all }))}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={70} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="value" name="Tasks" radius={[0, 4, 4, 0]}>
                  {(tasks?.byPriority ?? []).map((p) => (
                    <Cell key={p.priority} fill={PRIORITY_COLORS[p.priority]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Vocabulary & quizzes" subtitle="Learning progress" />
          {errVocab ? (
            <p className="text-sm text-red-500">{errorMessage(eVocab)}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Total words', value: vocab?.total ?? 0 },
                { label: 'Learned', value: vocab?.learned ?? 0 },
                { label: 'Favorites', value: vocab?.favorites ?? 0 },
                { label: 'Quiz average', value: `${vocab?.quiz.avgScore ? Math.round(vocab.quiz.avgScore) : 0}%` },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-slate-50 p-4 dark:bg-white/5">
                  <p className="font-display text-3xl font-bold text-slate-800 dark:text-white">{s.value}</p>
                  <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
                </div>
              ))}
              <div className="sm:col-span-2 lg:col-span-4">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={(vocab?.quiz.recent ?? []).map((a) => ({ label: a.date.slice(0, 10), score: a.score }))}>
                    <defs>
                      <linearGradient id="quizscore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="score" name="Score %" stroke="#10b981" fill="url(#quizscore)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
