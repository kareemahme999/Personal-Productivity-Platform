import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { tasksApi } from '@/api/endpoints';
import { errorMessage } from '@/api/client';
import type { Task } from '@/types';
import { PageHeader, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, Skeleton } from '@/components/ui/Base';
import { TaskModal } from '@/components/tasks/TaskModal';
import { useCategories } from '@/hooks/useCategories';
import { PRIORITY_META } from '@/lib/constants';
import { cn, toIsoDate, dateOnly } from '@/lib/utils';
import { isToday } from 'date-fns';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarPage() {
  const { data: cats } = useCategories();
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [modal, setModal] = useState<{ open: boolean; task: Task | null; defaultDate?: string }>({ open: false, task: null });

  const range = useMemo(() => {
    const start = new Date(monthCursor);
    start.setDate(1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    return { start: toIsoDate(start), end: toIsoDate(end) };
  }, [monthCursor]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['calendar', range],
    queryFn: () => tasksApi.list({ dueFrom: range.start, dueTo: range.end, limit: 200 }).then((r) => r.data.data.tasks),
  });

  const daysGrid = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const offset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [monthCursor]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of data ?? []) {
      if (!t.dueDate) continue;
      const key = dateOnly(t.dueDate);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return map;
  }, [data]);

  const monthLabel = monthCursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle="See your tasks across the month"
        icon={<CalendarDays className="h-5 w-5" />}
        action={
          <Button onClick={() => setModal({ open: true, task: null, defaultDate: range.start })}>
            <Plus className="h-4 w-4" />
            New task
          </Button>
        }
      />

      <Card className="!p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/5">
          <h2 className="font-display text-lg font-semibold text-slate-800 dark:text-white">{monthLabel}</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                const now = new Date();
                setMonthCursor(new Date(now.getFullYear(), now.getMonth(), 1));
              }}
              className="btn-secondary !px-3 !py-1.5 !text-xs"
            >
              Today
            </button>
            <button
              onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-96 w-full" />
          </div>
        ) : isError ? (
          <div className="p-6 text-sm text-red-500">{errorMessage(error)}</div>
        ) : (
          <>
            <div className="grid grid-cols-7 border-b border-slate-100 dark:border-white/5">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {daysGrid.map((date, i) => {
                if (!date) return <div key={`empty-${i}`} className="min-h-[96px] border-b border-r border-slate-50 dark:border-white/5" />;
                const key = toIsoDate(date);
                const dayTasks = tasksByDay.get(key) ?? [];
                const today = isToday(date);
                const inMonth = true;
                return (
                  <div
                    key={key}
                    className={cn(
                      'group min-h-[96px] cursor-pointer border-b border-r border-slate-100 p-1.5 transition hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5',
                      !inMonth && 'bg-slate-50/50 dark:bg-white/[.02]',
                    )}
                    onClick={() => setModal({ open: true, task: null, defaultDate: key })}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                          today
                            ? 'bg-brand-600 text-white'
                            : 'text-slate-600 dark:text-slate-300',
                        )}
                      >
                        {date.getDate()}
                      </span>
                      <span className="hidden text-[10px] font-semibold text-slate-400 group-hover:block">+</span>
                    </div>
                    <div className="space-y-0.5">
                      {dayTasks.slice(0, 3).map((t) => (
                        <button
                          key={t.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setModal({ open: true, task: t });
                          }}
                          className={cn(
                            'block w-full truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-medium transition',
                            t.status === 'COMPLETED'
                              ? 'bg-slate-100 text-slate-400 line-through dark:bg-white/5 dark:text-slate-500'
                              : 'text-slate-700 hover:brightness-95 dark:text-slate-200',
                          )}
                          style={
                            t.status === 'COMPLETED'
                              ? undefined
                              : { backgroundColor: `${PRIORITY_META[t.priority].dot}22` }
                          }
                        >
                          {t.title}
                        </button>
                      ))}
                      {dayTasks.length > 3 && (
                        <span className="block px-1.5 text-[10px] font-semibold text-slate-400">
                          +{dayTasks.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {!isLoading && !isError && data && data.length === 0 && (
        <div className="mt-4">
          <EmptyState
            icon={<CalendarDays className="h-6 w-6" />}
            title="No tasks this month"
            description="Click any day to add a task with that due date."
          />
        </div>
      )}

      <TaskModal
        open={modal.open}
        onClose={() => setModal({ open: false, task: null })}
        task={modal.task}
        categories={cats ?? []}
        defaultDueDate={modal.defaultDate}
      />
    </div>
  );
}
