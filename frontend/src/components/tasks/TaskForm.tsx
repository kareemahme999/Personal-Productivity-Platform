import { useEffect, useState } from 'react';
import { tasksApi } from '@/api/endpoints';
import type { TaskPayload } from '@/api/endpoints';
import { errorMessage } from '@/api/client';
import type { Category, Task } from '@/types';
import type { RecurrenceFrequency, TaskPriority, TaskStatus } from '@/types';
import { PRIORITY_META, RECURRENCE_META } from '@/lib/constants';
import { dateOnly } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select, Field } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export interface TaskFormValues {
  title: string;
  description: string;
  categoryId: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate: string;
  dueDate: string;
  startTime: string;
  endTime: string;
  notes: string;
  links: string[];
  recurrence: RecurrenceFrequency;
  recurrenceInterval: number;
  recurrenceEndDate: string;
}

export function emptyForm(): TaskFormValues {
  return {
    title: '',
    description: '',
    categoryId: '',
    priority: 'MEDIUM',
    status: 'PENDING',
    startDate: '',
    dueDate: '',
    startTime: '',
    endTime: '',
    notes: '',
    links: [''],
    recurrence: 'NONE',
    recurrenceInterval: 1,
    recurrenceEndDate: '',
  };
}

export function formFromTask(task: Task): TaskFormValues {
  return {
    title: task.title,
    description: task.description ?? '',
    categoryId: task.categoryId ?? '',
    priority: task.priority,
    status: task.status,
    startDate: dateOnly(task.startDate),
    dueDate: dateOnly(task.dueDate),
    startTime: task.startTime ?? '',
    endTime: task.endTime ?? '',
    notes: task.notes ?? '',
    links: task.links && task.links.length > 0 ? task.links : [''],
    recurrence: task.recurrence,
    recurrenceInterval: task.recurrenceInterval,
    recurrenceEndDate: dateOnly(task.recurrenceEndDate),
  };
}

export function TaskForm({
  task,
  categories,
  showApplyTo,
  initialDueDate,
  onSaved,
  onCancel,
}: {
  task?: Task;
  categories: Category[];
  showApplyTo?: boolean;
  initialDueDate?: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { error } = useToast();
  const isEdit = !!task;
  const [form, setForm] = useState<TaskFormValues>(() => {
    if (task) return formFromTask(task);
    const base = emptyForm();
    if (initialDueDate) base.dueDate = initialDueDate;
    return base;
  });
  const [applyTo, setApplyTo] = useState<'this' | 'series'>('this');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!task) {
      setForm((prev) => (initialDueDate ? { ...prev, dueDate: initialDueDate } : prev));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDueDate]);

  const set = <K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setLink = (i: number, value: string) => {
    const next = [...form.links];
    next[i] = value;
    set('links', next);
  };

  const addLink = () => set('links', [...form.links, '']);
  const removeLink = (i: number) => set('links', form.links.filter((_, idx) => idx !== i));

  const buildPayload = (): TaskPayload => {
    const links = form.links.map((l) => l.trim()).filter(Boolean);
    return {
      title: form.title.trim(),
      description: form.description.trim() || null,
      categoryId: form.categoryId || null,
      priority: form.priority,
      status: form.status,
      startDate: form.startDate || null,
      dueDate: form.dueDate || null,
      startTime: form.startTime || null,
      endTime: form.endTime || null,
      notes: form.notes.trim() || null,
      links: links.length > 0 ? links : undefined,
      recurrence: form.recurrence,
      recurrenceInterval: form.recurrenceInterval,
      recurrenceEndDate: form.recurrenceEndDate || null,
      ...(isEdit ? { applyTo } : {}),
    };
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      error('Title is required');
      return;
    }
    setSaving(true);
    try {
      if (isEdit && task) await tasksApi.update(task.id, buildPayload());
      else await tasksApi.create(buildPayload());
      onSaved();
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const repeating = form.recurrence !== 'NONE';

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Title" error={undefined}>
        <Input
          required
          autoFocus
          placeholder="e.g. Finish reading chapter 4"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
        />
      </Field>

      <Field label="Description">
        <Textarea
          placeholder="Optional details…"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Category">
          <Select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Priority">
          <Select value={form.priority} onChange={(e) => set('priority', e.target.value as TaskPriority)}>
            {(Object.keys(PRIORITY_META) as TaskPriority[]).map((p) => (
              <option key={p} value={p}>
                {PRIORITY_META[p].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => set('status', e.target.value as TaskStatus)}>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Start date">
          <Input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
        </Field>
        <Field label="Due date">
          <Input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
        </Field>
        <Field label="Start time">
          <Input type="time" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} />
        </Field>
        <Field label="End time">
          <Input type="time" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} />
        </Field>
      </div>

      <Field label="Notes">
        <Textarea placeholder="Optional notes…" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </Field>

      <Field label="Links">
        <div className="space-y-2">
          {form.links.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                type="url"
                placeholder="https://…"
                value={link}
                onChange={(e) => setLink(i, e.target.value)}
              />
              {form.links.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLink(i)}
                  className="shrink-0 rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addLink} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
            + Add link
          </button>
        </div>
      </Field>

      <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
        <Field label="Repeat">
          <Select value={form.recurrence} onChange={(e) => set('recurrence', e.target.value as RecurrenceFrequency)}>
            {(Object.keys(RECURRENCE_META) as RecurrenceFrequency[]).map((r) => (
              <option key={r} value={r}>
                {RECURRENCE_META[r].label}
              </option>
            ))}
          </Select>
        </Field>
        {repeating && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Every">
              <Input
                type="number"
                min={1}
                max={365}
                value={form.recurrenceInterval}
                onChange={(e) => set('recurrenceInterval', Math.max(1, Number(e.target.value)))}
              />
            </Field>
            <Field label="Ends on">
              <Input
                type="date"
                value={form.recurrenceEndDate}
                onChange={(e) => set('recurrenceEndDate', e.target.value)}
              />
            </Field>
          </div>
        )}
      </div>

      {isEdit && showApplyTo && (
        <Field label="Apply changes to">
          <div className="flex gap-2">
            {(
              [
                { value: 'this', label: 'This task only' },
                { value: 'series', label: 'Whole series' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setApplyTo(opt.value)}
                className={`btn flex-1 ${applyTo === opt.value ? 'btn-primary' : 'btn-secondary'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Field>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {isEdit ? 'Save changes' : 'Create task'}
        </Button>
      </div>
    </form>
  );
}
