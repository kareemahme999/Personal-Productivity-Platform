import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2, CircleDashed, AlertTriangle, Flame, Target, FolderOpen, BookOpen, ChevronRight, ListPlus,
} from 'lucide-react';
import { statisticsApi } from '@/api/endpoints';
import type { DashboardData } from '@/api/endpoints';
import { errorMessage } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Base';
import { TaskItem } from '@/components/tasks/TaskItem';
import { TaskModal } from '@/components/tasks/TaskModal';
import { useCategories } from '@/hooks/useCategories';
import { tasksApi } from '@/api/endpoints';
import type { Task } from '@/types';
import { ProgressBar } from '@/components/ui/Progress';
import { cn, formatRelativeDay } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'Working late';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: cats } = useCategories();
  const { error: toastError } = useToast();
  const queryClient = useQueryClient();
  const [taskModal, setTaskModal] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });

  const { data: dash, isLoading, isError, error } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => statisticsApi.dashboard().then((r) => r.data.data),
  });

  const toggleComplete = async (task: Task) => {
    try {
      await tasksApi.complete(task.id, task.status !== 'COMPLETED');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      toastError(errorMessage(err));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (isError || !dash) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <p className="text-sm text-red-500">{errorMessage(error)}</p>
      </Card>
    );
  }

  const t = dash.tasks;
  const firstName = user?.name.split(' ')[0] ?? 'friend';

  const statCards = [
    {
      label: 'Today\'s tasks',
      value: t.todayTasks,
      sub: `${t.completedToday} completed`,
      icon: CheckCircle2,
      color: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      label: 'Pending',
      value: t.pending,
      sub: `${t.overdue} overdue`,
      icon: CircleDashed,
      color: 'text-sky-500 bg-sky-500/10',
    },
    {
      label: 'Completion rate',
      value: `${Math.round(t.completionRate)}%`,
      sub: `${t.completed}/${t.total} done`,
      icon: Target,
      color: 'text-brand-500 bg-brand-500/10',
    },
    {
      label: 'Streak',
      value: `${t.currentStreak} days`,
      sub: `Best ${t.longestStreak}`,
      icon: Flame,
      color: 'text-orange-500 bg-orange-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-white">
            {greeting()}, {firstName} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button onClick={() => setTaskModal({ open: true, task: null })} className="btn-primary">
          <ListPlus className="h-4 w-4" />
          New task
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="flex items-center gap-4 !p-4">
            <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', s.color)}>
              <s.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
              <p className="font-display text-2xl font-bold text-slate-800 dark:text-white">{s.value}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{s.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Upcoming deadlines"
            subtitle={`${t.overdue} overdue · ${t.todayTasks} due today`}
            action={
              <button
                onClick={() => navigate('/tasks')}
                className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                All tasks <ChevronRight className="h-4 w-4" />
              </button>
            }
          />
          {dash.upcomingDeadlines.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No upcoming deadlines 🎉</p>
          ) : (
            <div className="space-y-1">
              {dash.upcomingDeadlines.map((task) => (
                <TaskItem key={task.id} task={task} onToggle={toggleComplete} onOpen={(t) => setTaskModal({ open: true, task: t })} />
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent resources & words"
            action={
              <button onClick={() => navigate('/resources')} className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                Resources <ChevronRight className="h-4 w-4" />
              </button>
            }
          />
          <div className="space-y-4">
            {dash.recentResources.length === 0 ? (
              <p className="py-2 text-sm text-slate-400">No resources yet.</p>
            ) : (
              <div className="space-y-1">
                {dash.recentResources.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => navigate('/resources')}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                      <FolderOpen className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{r.title}</p>
                      <p className="truncate text-xs text-slate-400">{r.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="border-t border-slate-100 pt-4 dark:border-white/5">
              <div className="mb-2 flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <BookOpen className="h-4 w-4 text-brand-500" />
                  Vocabulary
                </p>
                <button onClick={() => navigate('/english')} className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                  Learn <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <ProgressBar value={dash.vocabulary.learningProgress} className="flex-1" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {dash.vocabulary.learned}/{dash.vocabulary.total}
                </span>
              </div>
              {dash.recentWords.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {dash.recentWords.map((w) => (
                    <span key={w.id} className="badge border border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300">
                      {w.word}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Goals"
            action={
              <button onClick={() => navigate('/goals')} className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                All goals <ChevronRight className="h-4 w-4" />
              </button>
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-brand-600/5 p-4 dark:bg-brand-500/10">
              <p className="font-display text-3xl font-bold text-brand-600 dark:text-brand-300">{dash.goals.active}</p>
              <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">Active goals</p>
            </div>
            <div className="rounded-xl bg-emerald-500/5 p-4 dark:bg-emerald-500/10">
              <p className="font-display text-3xl font-bold text-emerald-600 dark:text-emerald-300">{dash.goals.completed}</p>
              <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">Completed</p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent quiz scores" />
          {dash.quiz.length === 0 ? (
            <p className="py-4 text-sm text-slate-400">Take your first vocabulary quiz on the English page.</p>
          ) : (
            <div className="space-y-2">
              {dash.quiz.slice(0, 3).map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-white/5">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold',
                        a.scorePercent >= 80
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                          : a.scorePercent >= 50
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300'
                            : 'bg-red-500/10 text-red-600 dark:text-red-300',
                      )}
                    >
                      {Math.round(a.scorePercent)}%
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {a.correctAnswers}/{a.totalQuestions} correct
                      </p>
                      <p className="text-xs text-slate-400">{formatRelativeDay(a.createdAt)}</p>
                    </div>
                  </div>
                  <AlertTriangle className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <TaskModal
        open={taskModal.open}
        onClose={() => setTaskModal({ open: false, task: null })}
        task={taskModal.task}
        categories={cats ?? []}
      />
    </div>
  );
}
