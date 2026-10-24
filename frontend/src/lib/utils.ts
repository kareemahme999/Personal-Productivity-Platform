import { format, isToday, isTomorrow, isYesterday, startOfDay } from 'date-fns';
import type { TaskStatus } from '@/types';

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Timezone-safe YYYY-MM-DD from API DateTime or date-only strings. */
export function dateOnly(value?: string | null): string {
  if (!value) return '';
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return match ? match[1] : toIsoDate(new Date(value));
}

export function parseDateOnly(value: string): Date {
  const [year, month, day] = dateOnly(value).split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(value?: string | null, pattern = 'EEE, MMM d'): string {
  if (!value) return 'No date';
  return format(parseDateOnly(value), pattern);
}

export function formatRelativeDay(value?: string | null): string {
  if (!value) return 'No date';
  const date = parseDateOnly(value);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEE, MMM d');
}

export function formatTime(value?: string | null): string {
  if (!value) return '';
  const [h, m] = value.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export function isOverdue(task: { dueDate?: string | null; status?: TaskStatus }): boolean {
  if (!task.dueDate || task.status === 'COMPLETED') return false;
  return startOfDay(parseDateOnly(task.dueDate)) < startOfDay(new Date());
}

export function isDueToday(task: { dueDate?: string | null }): boolean {
  if (!task.dueDate) return false;
  return isToday(parseDateOnly(task.dueDate));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadText(text: string, filename: string, mime = 'application/json') {
  downloadBlob(new Blob([text], { type: mime }), filename);
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}
