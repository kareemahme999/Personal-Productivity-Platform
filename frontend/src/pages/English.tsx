import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Search, Star, Sparkles, Play, Pencil, Trash2 } from 'lucide-react';
import { englishApi } from '@/api/endpoints';
import { errorMessage } from '@/api/client';
import type { EnglishWord } from '@/types';
import { formatRelativeDay, cn } from '@/lib/utils';
import { PageHeader, Card } from '@/components/ui/Card';
import { Input, Textarea, Select, Field } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState, Skeleton, Badge } from '@/components/ui/Base';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Progress';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/Toast';

interface WordFormState {
  word: string;
  meaning: string;
  exampleSentence: string;
  pronunciation: string;
  category: string;
  notes: string;
}

export function EnglishPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [filter, setFilter] = useState<'all' | 'favorites' | 'learned'>('all');
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState<{ open: boolean; word: EnglishWord | null }>({ open: false, word: null });
  const [confirmDelete, setConfirmDelete] = useState<EnglishWord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<WordFormState>({ word: '', meaning: '', exampleSentence: '', pronunciation: '', category: '', notes: '' });

  const { data: categoriesData } = useQuery({
    queryKey: ['word-categories'],
    queryFn: () => englishApi.categories().then((r) => r.data.data.categories),
  });

  const { data: wotd } = useQuery({
    queryKey: ['word-of-day'],
    queryFn: () => englishApi.wordOfDay().then((r) => r.data.data.word),
  });

  const { data, isLoading, isError, error: queryError } = useQuery({
    queryKey: ['words', search, category, filter, page],
    queryFn: () =>
      englishApi
        .list({
          q: search.trim() || undefined,
          category: category === 'ALL' ? undefined : category,
          favorite: filter === 'favorites' ? true : undefined,
          learned: filter === 'learned' ? true : undefined,
          page,
          limit: 12,
        })
        .then((r) => r.data.data),
  });

  const openCreate = () => {
    setForm({ word: '', meaning: '', exampleSentence: '', pronunciation: '', category: '', notes: '' });
    setModal({ open: true, word: null });
  };

  const openEdit = (w: EnglishWord) => {
    setForm({
      word: w.word,
      meaning: w.meaning,
      exampleSentence: w.exampleSentence ?? '',
      pronunciation: w.pronunciation ?? '',
      category: w.category ?? '',
      notes: w.notes ?? '',
    });
    setModal({ open: true, word: w });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.word.trim() || !form.meaning.trim()) {
      error('Word and meaning are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        word: form.word.trim(),
        meaning: form.meaning.trim(),
        exampleSentence: form.exampleSentence.trim() || null,
        pronunciation: form.pronunciation.trim() || null,
        category: form.category.trim() || null,
        notes: form.notes.trim() || null,
      };
      if (modal.word) {
        await englishApi.update(modal.word.id, payload);
        success('Word updated');
      } else {
        await englishApi.create(payload);
        success('Word added to vocabulary');
      }
      queryClient.invalidateQueries({ queryKey: ['words'] });
      queryClient.invalidateQueries({ queryKey: ['word-categories'] });
      queryClient.invalidateQueries({ queryKey: ['word-of-day'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setModal({ open: false, word: null });
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleFlag = async (w: EnglishWord, key: 'isLearned' | 'isFavorite') => {
    try {
      const patch = key === 'isLearned' ? { isLearned: !w.isLearned } : { isFavorite: !w.isFavorite };
      await englishApi.learned(w.id, patch);
      queryClient.invalidateQueries({ queryKey: ['words'] });
      queryClient.invalidateQueries({ queryKey: ['word-of-day'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err) {
      error(errorMessage(err));
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await englishApi.remove(confirmDelete.id);
      success('Word deleted');
      queryClient.invalidateQueries({ queryKey: ['words'] });
      queryClient.invalidateQueries({ queryKey: ['word-of-day'] });
      setConfirmDelete(null);
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="English vocabulary"
        subtitle="Learn words, review meanings and test yourself with quizzes"
        icon={<BookOpen className="h-5 w-5" />}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/english/quiz')}>
              <Play className="h-4 w-4" />
              Start quiz
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add word
            </Button>
          </div>
        }
      />

      {wotd && (
        <Card className="mb-4 overflow-hidden !p-0">
          <div className="bg-gradient-to-r from-brand-600 to-indigo-600 px-5 py-4 text-white">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-100">
              <Sparkles className="h-3.5 w-3.5" /> Word of the day
            </p>
            <div className="mt-1 flex flex-wrap items-baseline gap-3">
              <h2 className="font-display text-3xl font-bold">{wotd.word}</h2>
              {wotd.pronunciation && <span className="text-sm text-brand-100">/{wotd.pronunciation}/</span>}
            </div>
            <p className="mt-1 text-sm text-brand-50">{wotd.meaning}</p>
            {wotd.exampleSentence && (
              <p className="mt-2 border-t border-white/20 pt-2 text-sm italic text-brand-50">“{wotd.exampleSentence}”</p>
            )}
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => toggleFlag(wotd, 'isLearned')}
                className={cn(
                  'badge cursor-pointer transition',
                  wotd.isLearned
                    ? 'bg-emerald-400/90 text-emerald-950'
                    : 'bg-white/15 text-white hover:bg-white/25',
                )}
              >
                {wotd.isLearned ? '✓ Learned' : 'Mark learned'}
              </button>
              <button
                onClick={() => toggleFlag(wotd, 'isFavorite')}
                className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition hover:bg-white/15"
              >
                <Star className={cn('h-3.5 w-3.5', wotd.isFavorite && 'fill-amber-300 text-amber-300')} />
                Favorite
              </button>
            </div>
          </div>
        </Card>
      )}

      <Card className="mb-4 !p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input className="!pl-9" placeholder="Search words…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
          </Field>
          <Field label="Category">
            <Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
              <option value="ALL">All categories</option>
              {(categoriesData ?? []).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Filter">
            <Select value={filter} onChange={(e) => { setFilter(e.target.value as typeof filter); setPage(1); }}>
              <option value="all">All words</option>
              <option value="favorites">Favorites</option>
              <option value="learned">Learned</option>
            </Select>
          </Field>
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : isError || !data ? (
        <Card><p className="text-sm text-red-500">{errorMessage(queryError)}</p></Card>
      ) : data.words.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="No words found"
          description="Add your first word or adjust the filters."
          action={<Button onClick={openCreate}><Plus className="h-4 w-4" />Add word</Button>}
        />
      ) : (
        <>
          <div className="space-y-2">
            {data.words.map((w) => (
              <Card key={w.id} className="group !p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-semibold text-slate-800 dark:text-white">{w.word}</h3>
                      {w.pronunciation && <span className="text-sm text-slate-400">/{w.pronunciation}/</span>}
                      {w.category && <Badge className="bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">{w.category}</Badge>}
                      {w.isLearned && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">Learned</Badge>}
                      {w.isFavorite && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
                    </div>
                    <p className="mt-0.5 text-sm font-medium text-slate-600 dark:text-slate-300">{w.meaning}</p>
                    {w.exampleSentence && <p className="mt-1 text-sm italic text-slate-500 dark:text-slate-400">“{w.exampleSentence}”</p>}
                    <p className="mt-1 text-xs text-slate-400">Added {formatRelativeDay(w.createdAt)} · reviewed {w.reviewCount}×</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleFlag(w, 'isFavorite')}
                        className={cn(
                          'rounded-lg p-1.5 transition',
                          w.isFavorite ? 'text-amber-400' : 'text-slate-400 hover:text-amber-400',
                        )}
                        aria-label="Toggle favorite"
                      >
                        <Star className={cn('h-4 w-4', w.isFavorite && 'fill-amber-400')} />
                      </button>
                      <button
                        onClick={() => toggleFlag(w, 'isLearned')}
                        className={cn(
                          'rounded-lg px-2 py-1 text-xs font-semibold transition',
                          w.isLearned
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                            : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10',
                        )}
                      >
                        {w.isLearned ? 'Learned' : 'Mark learned'}
                      </button>
                      <button
                        onClick={() => openEdit(w)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(w)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Pagination page={data.pagination.page} pages={data.pagination.pages} total={data.pagination.total} onChange={setPage} />
        </>
      )}

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, word: null })}
        title={modal.word ? 'Edit word' : 'Add word'}
        size="md"
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Word">
              <Input required placeholder="serendipity" value={form.word} onChange={(e) => setForm({ ...form, word: e.target.value })} />
            </Field>
            <Field label="Pronunciation">
              <Input placeholder="/ser-en-dip-i-tee/" value={form.pronunciation} onChange={(e) => setForm({ ...form, pronunciation: e.target.value })} />
            </Field>
          </div>
          <Field label="Meaning">
            <Textarea required placeholder="The occurrence of events by chance in a happy or beneficial way" value={form.meaning} onChange={(e) => setForm({ ...form, meaning: e.target.value })} />
          </Field>
          <Field label="Example sentence">
            <Textarea placeholder="Meeting her again was pure serendipity." value={form.exampleSentence} onChange={(e) => setForm({ ...form, exampleSentence: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <Input placeholder="e.g. Academic, Daily" list="word-categories" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <datalist id="word-categories">
                {(categoriesData ?? []).map((c) => <option key={c} value={c} />)}
              </datalist>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setModal({ open: false, word: null })}>Cancel</Button>
            <Button type="submit" loading={saving}>{modal.word ? 'Save changes' : 'Add word'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={doDelete}
        loading={deleting}
        title="Delete word?"
        message={`“${confirmDelete?.word}” will be removed from your vocabulary.`}
      />
    </div>
  );
}
