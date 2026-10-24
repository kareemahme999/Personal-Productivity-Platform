import { cn } from '@/lib/utils';

export function ProgressBar({
  value,
  className,
  barClassName,
  color,
}: {
  value: number;
  className?: string;
  barClassName?: string;
  color?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10', className)}>
      <div
        className={cn('h-full rounded-full bg-brand-600 transition-all', barClassName)}
        style={color ? { width: `${clamped}%`, backgroundColor: color } : { width: `${clamped}%` }}
      />
    </div>
  );
}

export function Pagination({
  page,
  pages,
  total,
  onChange,
}: {
  page: number;
  pages: number;
  total?: number;
  onChange: (page: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 pt-4 text-sm text-slate-500 dark:text-slate-400">
      {total !== undefined ? <span>{total} item{total === 1 ? '' : 's'}</span> : <span />}
      <div className="flex items-center gap-1.5">
        <button
          className="btn-secondary !px-2.5 !py-1.5 !text-xs"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Prev
        </button>
        <span className="px-2 text-xs font-medium">
          Page {page} of {pages}
        </span>
        <button
          className="btn-secondary !px-2.5 !py-1.5 !text-xs"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
