import { useQuery } from '@tanstack/react-query';
import { Bell, AlertTriangle, CalendarClock, Sunrise, Hourglass } from 'lucide-react';
import { notificationsApi } from '@/api/endpoints';
import type { NotificationsData } from '@/api/endpoints';
import { errorMessage } from '@/api/client';
import { PageHeader, Card, CardHeader } from '@/components/ui/Card';
import { Skeleton, EmptyState } from '@/components/ui/Base';
import { TaskItem } from '@/components/tasks/TaskItem';
import { useState } from 'react';
import { TaskModal } from '@/components/tasks/TaskModal';
import { useCategories } from '@/hooks/useCategories';
import { tasksApi } from '@/api/endpoints';
import type { Task } from '@/types';
import { useQueryClient } from '@tanstack/react-query';

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: cats } = useCategories();
  const [modal, setModal] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });

  const { data, isLoading, isError, error } = useQuery<NotificationsData>({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list().then((r) => r.data.data),
  });

  const toggleComplete = async (task: Task) => {
    await tasksApi.complete(task.id, task.status !== 'COMPLETED');
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
      </div>
    );
  }

  if (isError || !data) {
    return <Card><p className="text-sm text-red-500">{errorMessage(error)}</p></Card>;
  }

  const total =
    data.overdue.length + data.dueToday.length + data.dueTomorrow.length + data.upcoming.length;

  if (total === 0) {
    return (
      <div>
        <PageHeader title="Notifications" subtitle="Deadlines and reminders for your tasks" icon={<Bell className="h-5 w-5" />} />
        <EmptyState
          icon={<Bell className="h-6 w-6" />}
          title="You're all caught up"
          description="No upcoming or overdue tasks right now."
        />
      </div>
    );
  }

  const sections: { key: string; title: string; icon: React.ElementType; accent: string; tasks: Task[] }[] = [
    { key: 'overdue', title: `Overdue (${data.overdue.length})`, icon: AlertTriangle, accent: 'text-red-500', tasks: data.overdue },
    { key: 'today', title: `Due today (${data.dueToday.length})`, icon: Sunrise, accent: 'text-amber-500', tasks: data.dueToday },
    { key: 'tomorrow', title: `Due tomorrow (${data.dueTomorrow.length})`, icon: CalendarClock, accent: 'text-sky-500', tasks: data.dueTomorrow },
    { key: 'upcoming', title: `Upcoming (${data.upcoming.length})`, icon: Hourglass, accent: 'text-slate-400', tasks: data.upcoming },
  ];

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Deadlines and reminders for your tasks" icon={<Bell className="h-5 w-5" />} />
      <div className="space-y-4">
        {sections
          .filter((s) => s.tasks.length > 0)
          .map((s) => (
            <Card key={s.key} className="!p-0 overflow-hidden">
              <CardHeader
                title={
                  <span className={`flex items-center gap-2 ${s.accent}`}>
                    <s.icon className="h-4 w-4" />
                    {s.title}
                  </span>
                }
                className="!mb-0 !px-4 !py-3 border-b border-slate-100 dark:border-white/5"
              />
              <div className="p-2">
                {s.tasks.map((t) => (
                  <TaskItem key={t.id} task={t} onToggle={toggleComplete} onOpen={(task) => setModal({ open: true, task })} />
                ))}
              </div>
            </Card>
          ))}
      </div>
      <TaskModal open={modal.open} onClose={() => setModal({ open: false, task: null })} task={modal.task} categories={cats ?? []} />
    </div>
  );
}
