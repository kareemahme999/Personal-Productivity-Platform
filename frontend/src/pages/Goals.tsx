import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Target, Plus, Pencil, Trash2, Flag, CheckCircle2 } from 'lucide-react';
import { goalsApi } from '@/api/endpoints';
import { errorMessage } from '@/api/client';
import type { Goal, GoalStatus } from '@/types';
import { GOAL_STATUS_META } from '@/lib/constants';
import { formatRelativeDay, dateOnly } from '@/lib/utils';
import { PageHeader, Card } from '@/components/ui/Card';
import { Input, Textarea, Select, Field } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState, Skeleton, Badge } from '@/components/ui/Base';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/Progress';
import { useToast } from '@/components/ui/Toast';

interface GoalFormState {
  title: string;
  description: string;
  deadline: string;
  progress: number;
  status: GoalStatus;
  category: string;
}

export function GoalsPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [statusFilter, setStatusFilter] = useState<'ALL' | GoalStatus>('ALL');

  const [modal, setModal] = useState<{ open: boolean; goal: Goal | null }>({ open: false, goal: null });
  const [confirmDelete, setConfirmDelete] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<GoalFormState>({ title: '', description: '', deadline: '', progress: 0, status: 'ACTIVE', category: '' });

  const { data, isLoading, isError, error: queryError } = useQuery({
    queryKey: ['goals', statusFilter],
    queryFn: () =>
      goalsApi.list({ status: statusFilter === 'ALL' ? undefined : statusFilter, limit: 100 }).then((r) => r.data.data),
  });

  const openCreate = () => {
    setForm({ title: '', description: '', deadline: '', progress: 0, status: 'ACTIVE', category: '' });
    setModal({ open: true, goal: null });
  };

  const openEdit = (g: Goal) => {
    setForm({
      title: g.title,
      description: g.description ?? '',
      deadline: g.deadline ? dateOnly(g.deadline) : '',
      progress: g.progress,
      status: g.status,
      category: g.category ?? '',
    });
    setModal({ open: true, goal: g });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      error('Title is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        deadline: form.deadline || null,
        progress: Math.min(100, Math.max(0, form.progress)),
        status: form.progress >= 100 ? 'COMPLETED' : form.status,
        category: form.category.trim() || null,
      };
      if (modal.goal) {
        await goalsApi.update(modal.goal.id, payload);
        success('Goal updated');
      } else {
        await goalsApi.create(payload);
        success('Goal created — good luck!');
      }
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setModal({ open: false, goal: null });
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const quickProgress = async (g: Goal, delta: number) => {
    try {
      const next = Math.min(100, Math.max(0, g.progress + delta));
      const completed = next >= 100;
      await goalsApi.update(g.id, { progress: next, status: completed ? 'COMPLETED' : 'ACTIVE' });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err) {
      error(errorMessage(err));
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await goalsApi.remove(confirmDelete.id);
      success('Goal deleted');
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setConfirmDelete(null);
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const tabs: { key: 'ALL' | GoalStatus; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'ACTIVE', label: 'Active' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'ARCHIVED', label: 'Archived' },
  ];

  return (
    <div>
      <PageHeader
        title="Goals"
        subtitle="Set targets and track your progress"
        icon={<Target className="h-5 w-5" />}
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New goal
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatusFilter(t.key)}
            className={
              statusFilter === t.key
                ? 'badge !cursor-pointer border border-brand-600 bg-brand-600 px-3 py-1.5 text-white'
                : 'badge !cursor-pointer border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44" />)}
        </div>
      ) : isError || !data ? (
        <Card><p className="text-sm text-red-500">{errorMessage(queryError)}</p></Card>
      ) : data.goals.length === 0 ? (
        <EmptyState
          icon={<Target className="h-6 w-6" />}
          title="No goals yet"
          description="Define what you want to achieve and track progress step by step."
          action={<Button onClick={openCreate}><Plus className="h-4 w-4" />New goal</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.goals.map((g) => (
            <Card key={g.id} className="flex flex-col !p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                  {g.status === 'COMPLETED' ? <CheckCircle2 className="h-5 w-5" /> : <Flag className="h-5 w-5" />}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(g)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10" aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setConfirmDelete(g)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <h3 className="mt-3 font-display text-lg font-semibold text-slate-800 dark:text-white">{g.title}</h3>
              {g.description && <p className="mt-0.5 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{g.description}</p>}

              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{g.progress}%</span>
                  {g.deadline && <span className="text-xs text-slate-400">Due {formatRelativeDay(g.deadline)}</span>}
                </div>
                <ProgressBar
                  value={g.progress}
                  color={
                    g.status === 'COMPLETED'
                      ? '#10b981'
                      : g.deadline && new Date(g.deadline) < new Date() && g.progress < 100
                        ? '#ef4444'
                        : undefined
                  }
                />
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge className={GOAL_STATUS_META[g.status].badge}>{GOAL_STATUS_META[g.status].label}</Badge>
                  {g.category && <Badge className="bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">{g.category}</Badge>}
                </div>
                {g.status !== 'COMPLETED' && (
                  <div className="flex gap-1">
                    <button onClick={() => quickProgress(g, -10)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">−10</button>
                    <button onClick={() => quickProgress(g, 10)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">+10</button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, goal: null })}
        title={modal.goal ? 'Edit goal' : 'New goal'}
        size="md"
      >
        <form onSubmit={submit} className="space-y-4">
          <Field label="Title">
            <Input required placeholder="e.g. Read 12 books this year" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Description">
            <Textarea placeholder="Optional…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Deadline">
              <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </Field>
            <Field label="Category">
              <Input placeholder="e.g. Health, Career, Study" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </Field>
          </div>
          <Field label={`Progress: ${form.progress}%`}>
            <Input type="range" min={0} max={100} value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as GoalStatus })}>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setModal({ open: false, goal: null })}>Cancel</Button>
            <Button type="submit" loading={saving}>{modal.goal ? 'Save changes' : 'Create goal'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={doDelete}
        loading={deleting}
        title="Delete goal?"
        message={`“${confirmDelete?.title}” will be permanently removed.`}
      />
    </div>
  );
}
