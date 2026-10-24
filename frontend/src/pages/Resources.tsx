import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderOpen, Plus, Search, Link2, FileText, StickyNote, Upload, ExternalLink, Trash2, Pencil } from 'lucide-react';
import { resourcesApi } from '@/api/endpoints';
import { errorMessage, assetUrl } from '@/api/client';
import type { Resource, ResourceType } from '@/types';
import { RESOURCE_TYPE_META } from '@/lib/constants';
import { formatRelativeDay, formatFileSize, cn } from '@/lib/utils';
import { PageHeader, Card } from '@/components/ui/Card';
import { Input, Textarea, Select, Field } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState, Skeleton, Badge } from '@/components/ui/Base';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Progress';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/components/ui/Toast';

const TYPE_ICONS: Record<ResourceType, React.ElementType> = {
  LINK: Link2,
  FILE: FileText,
  NOTE: StickyNote,
};

interface FormState {
  title: string;
  description: string;
  url: string;
  type: ResourceType;
  categoryId: string;
  file: File | null;
}

export function ResourcesPage() {
  const queryClient = useQueryClient();
  const { data: cats } = useCategories();
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [typeFilter, setTypeFilter] = useState<'ALL' | ResourceType>('ALL');
  const [categoryId, setCategoryId] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState<{ open: boolean; resource: Resource | null }>({ open: false, resource: null });
  const [confirmDelete, setConfirmDelete] = useState<Resource | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<FormState>({ title: '', description: '', url: '', type: 'LINK', categoryId: '', file: null });

  const { data, isLoading, isError, error: queryError } = useQuery({
    queryKey: ['resources', typeFilter, categoryId, search, page],
    queryFn: () =>
      resourcesApi
        .list({
          type: typeFilter === 'ALL' ? undefined : typeFilter,
          categoryId: categoryId === 'ALL' ? undefined : categoryId,
          q: search.trim() || undefined,
          page,
          limit: 12,
        })
        .then((r) => r.data.data),
  });

  const openCreate = () => {
    setForm({ title: '', description: '', url: '', type: 'LINK', categoryId: '', file: null });
    setModal({ open: true, resource: null });
  };

  const openEdit = (r: Resource) => {
    setForm({
      title: r.title,
      description: r.description ?? '',
      url: r.url ?? '',
      type: r.type,
      categoryId: r.categoryId ?? '',
      file: null,
    });
    setModal({ open: true, resource: r });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      error('Title is required');
      return;
    }
    if (form.type === 'LINK' && !form.url.trim()) {
      error('URL is required for a link resource');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        url: form.url.trim() || undefined,
        type: form.type,
        categoryId: form.categoryId || undefined,
      };
      if (modal.resource) {
        await resourcesApi.update(modal.resource.id, payload, form.file ?? undefined);
        success('Resource updated');
      } else {
        await resourcesApi.create(payload, form.file ?? undefined);
        success('Resource created');
      }
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setModal({ open: false, resource: null });
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await resourcesApi.remove(confirmDelete.id);
      success('Resource deleted');
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setConfirmDelete(null);
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const canSubmitFile = form.file !== null;

  return (
    <div>
      <PageHeader
        title="Resources"
        subtitle="Books, links, files and notes worth keeping"
        icon={<FolderOpen className="h-5 w-5" />}
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add resource
          </Button>
        }
      />

      <Card className="mb-4 !p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="!pl-9"
                placeholder="Search resources…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </Field>
          <Field label="Type">
            <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value as typeof typeFilter); setPage(1); }}>
              <option value="ALL">All types</option>
              <option value="LINK">Links</option>
              <option value="FILE">Files</option>
              <option value="NOTE">Notes</option>
            </Select>
          </Field>
          <Field label="Category">
            <Select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}>
              <option value="ALL">All categories</option>
              {(cats ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : isError || !data ? (
        <Card><p className="text-sm text-red-500">{errorMessage(queryError)}</p></Card>
      ) : data.resources.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-6 w-6" />}
          title="No resources yet"
          description="Save links, upload files or jot down notes to build your knowledge base."
          action={<Button onClick={openCreate}><Plus className="h-4 w-4" />Add resource</Button>}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.resources.map((r) => {
              const Icon = TYPE_ICONS[r.type];
              return (
                <Card key={r.id} className="group flex flex-col !p-4 transition hover:border-brand-400/50">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(r)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-300"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(r)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="line-clamp-2 font-display text-base font-semibold text-slate-800 dark:text-white">{r.title}</h3>
                  {r.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{r.description}</p>}

                  <div className="mt-auto pt-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <Badge className={RESOURCE_TYPE_META[r.type].badge}>{RESOURCE_TYPE_META[r.type].label}</Badge>
                      {r.type === 'FILE' && r.fileSize && <span>{formatFileSize(r.fileSize)}</span>}
                      {r.category && (
                        <span className="inline-flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: r.category.color }} />
                          {r.category.name}
                        </span>
                      )}
                      <span>· {formatRelativeDay(r.createdAt)}</span>
                    </div>
                    {r.type === 'FILE' && r.filePath && (
                      <a
                        href={assetUrl(r.filePath)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                      >
                        Open file <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {r.type === 'LINK' && r.url && (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                      >
                        Visit link <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
          <Pagination page={data.pagination.page} pages={data.pagination.pages} total={data.pagination.total} onChange={setPage} />
        </>
      )}

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, resource: null })}
        title={modal.resource ? 'Edit resource' : 'Add resource'}
        size="md"
      >
        <form onSubmit={submit} className="space-y-4">
          <Field label="Title">
            <Input required placeholder="e.g. Clean Architecture — book" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ResourceType })}>
                <option value="LINK">Link</option>
                <option value="FILE">File</option>
                <option value="NOTE">Note</option>
              </Select>
            </Field>
            <Field label="Category">
              <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">None</option>
                {(cats ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
          </div>

          {form.type === 'LINK' && (
            <Field label="URL">
              <Input type="url" required placeholder="https://…" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </Field>
          )}

          {form.type === 'FILE' && (
            <Field label="File" hint={form.file ? `${form.file.name} (${formatFileSize(form.file.size)})` : modal.resource?.fileName ? `Current: ${modal.resource.fileName}` : undefined}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-sm transition',
                  form.file
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : 'border-slate-300 text-slate-400 hover:border-brand-400 hover:text-brand-600 dark:border-white/10',
                )}
              >
                <Upload className="h-5 w-5" />
                {form.file ? 'File selected' : 'Click to choose a file'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })}
              />
            </Field>
          )}

          {form.type !== 'FILE' && (
            <Field label="Description">
              <Textarea placeholder="Optional…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setModal({ open: false, resource: null })}>
              Cancel
            </Button>
            <Button type="submit" loading={saving} disabled={form.type === 'FILE' && !canSubmitFile && !modal.resource}>
              {modal.resource ? 'Save changes' : 'Add resource'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={doDelete}
        loading={deleting}
        title="Delete resource?"
        message={`“${confirmDelete?.title}” will be permanently removed.`}
      />
    </div>
  );
}
