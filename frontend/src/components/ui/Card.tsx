import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('card p-5', className)} {...props} />;
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-3', className)}>
      <div>
        <h3 className="font-display text-lg font-semibold text-slate-800 dark:text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
            {icon}
          </div>
        )}
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-white">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
