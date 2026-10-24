import { cn } from '@/lib/utils';

export function Badge({ className, children, dot }: { className?: string; children: React.ReactNode; dot?: string }) {
  return (
    <span className={cn('badge', className)}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />}
      {children}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600/20 border-t-brand-600" />
    </div>
  );
}

export function InlineSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn('h-4 w-4 animate-spin rounded-full border-2 border-current/25 border-t-current', className)}
    />
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-white/10">
      {icon && (
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
          {icon}
        </div>
      )}
      <h3 className="font-display text-base font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-slate-200 dark:bg-white/10', className)} />;
}
