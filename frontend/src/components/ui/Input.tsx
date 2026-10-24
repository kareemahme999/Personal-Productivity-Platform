import { forwardRef } from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn('input', className)} {...props} />,
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn('input min-h-[90px] resize-y', className)} {...props} />
  ),
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn('input cursor-pointer appearance-none', className)} {...props}>
      {children}
    </select>
  ),
);
Select.displayName = 'Select';

export function Field({
  label,
  error,
  hint,
  children,
  className,
}: {
  label?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <label className="label !mb-0">{label}</label>}
      {children}
      {hint && !error && <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}
