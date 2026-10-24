import { Repeat, Link2 } from 'lucide-react';
import type { Task } from '@/types';
import { PRIORITY_META, RECURRENCE_META } from '@/lib/constants';
import { formatRelativeDay, formatTime, isOverdue, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Base';

export function TaskItem({
  task,
  onToggle,
  onOpen,
  compact,
}: {
  task: Task;
  onToggle?: (task: Task) => void;
  onOpen?: (task: Task) => void;
  compact?: boolean;
}) {
  const completed = task.status === 'COMPLETED';
  const overdue = isOverdue(task);
  const category = task.category;

  const body = (
    <>
      <span
        role="checkbox"
        aria-checked={completed}
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onToggle?.(task);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            onToggle?.(task);
          }
        }}
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition',
          completed
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-slate-300 hover:border-brand-500 dark:border-slate-600',
        )}
      >
        {completed && (
          <svg viewBox="0 0 12 12" className="h-3 w-3 fill-none stroke-current stroke-2">
            <path d="M2 6.5 4.5 9 10 3" />
          </svg>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-medium', completed ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-800 dark:text-slate-100')}>
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {task.recurrence !== 'NONE' && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500" title={`Repeats ${RECURRENCE_META[task.recurrence].label.toLowerCase()}`}>
              <Repeat className="h-3 w-3" />
              {RECURRENCE_META[task.recurrence].short}
            </span>
          )}
          {task.links && task.links.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
              <Link2 className="h-3 w-3" />
              {task.links.length}
            </span>
          )}
          {task.dueDate && (
            <span
              className={cn(
                'text-xs',
                overdue ? 'font-semibold text-red-500' : 'text-slate-400 dark:text-slate-500',
              )}
            >
              {formatRelativeDay(task.dueDate)}
              {task.startTime && !completed ? ` · ${formatTime(task.startTime)}` : ''}
            </span>
          )}
        </div>
      </div>

      {!compact && (
        <div className="flex shrink-0 items-center gap-2">
          <Badge className={PRIORITY_META[task.priority].badge} dot={PRIORITY_META[task.priority].dot}>
            {PRIORITY_META[task.priority].label}
          </Badge>
          {category && (
            <Badge className="border border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
              {category.name}
            </Badge>
          )}
        </div>
      )}
    </>
  );

  const className = cn(
    'group flex items-start gap-3 rounded-xl border border-transparent px-3 py-2.5 transition',
    'hover:border-slate-200 hover:bg-slate-50 dark:hover:border-white/10 dark:hover:bg-white/5',
  );

  if (onOpen) {
    return (
      <div role="button" tabIndex={0} onClick={() => onOpen(task)} onKeyDown={(e) => { if (e.key === 'Enter') onOpen(task); }} className={className}>
        {body}
      </div>
    );
  }
  return <div className={className}>{body}</div>;
}
