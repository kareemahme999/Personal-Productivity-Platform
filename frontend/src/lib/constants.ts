import type { GoalStatus, RecurrenceFrequency, ResourceType, TaskPriority, TaskStatus } from '@/types';

export const PRIORITY_META: Record<TaskPriority, { label: string; badge: string; dot: string }> = {
  LOW: { label: 'Low', badge: 'bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300', dot: 'bg-slate-400' },
  MEDIUM: { label: 'Medium', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300', dot: 'bg-blue-500' },
  HIGH: { label: 'High', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', dot: 'bg-amber-500' },
  URGENT: { label: 'Urgent', badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300', dot: 'bg-red-500' },
};

export const STATUS_META: Record<TaskStatus, { label: string; badge: string }> = {
  PENDING: { label: 'Pending', badge: 'bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300' },
  IN_PROGRESS: { label: 'In progress', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300' },
  COMPLETED: { label: 'Completed', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
};

export const RECURRENCE_META: Record<RecurrenceFrequency, { label: string; short: string }> = {
  NONE: { label: 'Does not repeat', short: '—' },
  DAILY: { label: 'Every day', short: 'Daily' },
  WEEKLY: { label: 'Every week', short: 'Weekly' },
  MONTHLY: { label: 'Every month', short: 'Monthly' },
  YEARLY: { label: 'Every year', short: 'Yearly' },
};

export const RESOURCE_TYPE_META: Record<ResourceType, { label: string; badge: string }> = {
  LINK: { label: 'Link', badge: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' },
  FILE: { label: 'File', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300' },
  NOTE: { label: 'Note', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
};

export const GOAL_STATUS_META: Record<GoalStatus, { label: string; badge: string }> = {
  ACTIVE: { label: 'Active', badge: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' },
  COMPLETED: { label: 'Completed', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  ARCHIVED: { label: 'Archived', badge: 'bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300' },
};

export const PRESET_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

export const THEME_KEY = 'aura_theme';
