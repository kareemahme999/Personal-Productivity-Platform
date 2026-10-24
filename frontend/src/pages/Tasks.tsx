import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ListTodo, Plus, Search, ListFilter } from 'lucide-react';
import { tasksApi } from '@/api/endpoints';
import type { TaskQuery } from '@/api/endpoints';
import { errorMessage } from '@/api/client';
import type { Task } from '@/types';
import type { TaskPriority, TaskStatus } from '@/types';
import { PRIORITY_META } from '@/lib/constants';
import { PageHeader, Card } from '@/components/ui/Card';
import { Input, Select, Field } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState, Skeleton, Badge } from '@/components/ui/Base';
import { TaskItem } from '@/components/tasks/TaskItem';
import { TaskModal } from '@/components/tasks/TaskModal';
import { useCategories } from '@/hooks/useCategories';
import { Pagination } from '@/components/ui/Progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

type StatusFilter = 'ALL' | TaskStatus;

export function TasksPage() {
  const queryClient = useQueryClient();
  const { data: cats } = useCategories();
  const { error: toastError } = useToast();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [priority, setPriority] = useState<'ALL' | TaskPriority>('ALL');
  const [categoryId, setCategoryId] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });

  const query: TaskQuery = useMemo(() => {
    const q: TaskQuery = { page, limit: 20 };
    if (statusFilter !== 'ALL') q.status = statusFilter;
    if (priority !== 'ALL') q.priority = priority;
    if (categoryId !== 'ALL') q.categoryId = categoryId;
    if (search.trim()) q.q = search.trim();
    return q;
  }, [statusFilter, priority, categoryId, search, page]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['tasks', query],
    queryFn: () => tasksApi.list(query).then((r) => r.data.data),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const toggleComplete = async (task: Task) => {
    try {
      await tasksApi.complete(task.id, task.status !== 'COMPLETED');
      invalidate();
    } catch (err) {
      toastError(errorMessage(err));
    }
  };

  const tabs: { key: StatusFilter; label: string; count?: number }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'IN_PROGRESS', label: 'In progress' },
    { key: 'COMPLETED', label: 'Completed' },
  ];

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle="Manage your to-dos, deadlines and recurring tasks"
        icon={<ListTodo className="h-5 w-5" />}
        action={
          <Button onClick={() => setModal({ open: true, task: null })}>
            <Plus className="h-4 w-4" />
            New task
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setStatusFilter(t.key);
              setPage(1);
            }}
            className={cn(
              'badge !cursor-pointer border px-3 py-1.5 transition',
              statusFilter === t.key
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="mb-4 !p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="!pl-9"
                placeholder="Search tasks…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </Field>
          <Field label="Priority">
            <Select value={priority} onChange={(e) => { setPriority(e.target.value as typeof priority); setPage(1); }}>
              <option value="ALL">All priorities</option>
              {(Object.keys(PRIORITY_META) as TaskPriority[]).map((p) => (
                <option key={p} value={p}>{PRIORITY_META[p].label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Category">
            <Select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}>
              <option value="ALL">All categories</option>
              {(cats ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label=" ">
            <button
              onClick={() => {
                setSearch('');
                setPriority('ALL');
                setCategoryId('ALL');
                setStatusFilter('ALL');
                setPage(1);
              }}
              className="btn-secondary w-full"
            >
              <ListFilter className="h-4 w-4" />
              Clear filters
            </button>
          </Field>
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : isError || !data ? (
        <Card>
          <p className="text-sm text-red-500">{errorMessage(error)}</p>
        </Card>
      ) : data.tasks.length === 0 ? (
        <EmptyState
          icon={<ListTodo className="h-6 w-6" />}
          title="No tasks found"
          description="Try adjusting your filters or create a new task to get started."
          action={
            <Button onClick={() => setModal({ open: true, task: null })}>
              <Plus className="h-4 w-4" />
              New task
            </Button>
          }
        />
      ) : (
        <>
          <Card className="!p-2">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2 dark:border-white/5">
              <Badge className="bg-brand-600/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                {data.pagination.total} task{data.pagination.total === 1 ? '' : 's'}
              </Badge>
              {statusFilter === 'COMPLETED' && (
                <span className="text-xs text-slate-400">Keep up the momentum! 💪</span>
              )}
            </div>
            <div className="p-2">
              {data.tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={toggleComplete}
                  onOpen={(t) => setModal({ open: true, task: t })}
                />
              ))}
            </div>
          </Card>
          <Pagination
            page={data.pagination.page}
            pages={data.pagination.pages}
            total={data.pagination.total}
            onChange={setPage}
          />
        </>
      )}

      <TaskModal open={modal.open} onClose={() => setModal({ open: false, task: null })} task={modal.task} categories={cats ?? []} />
    </div>
  );
}
