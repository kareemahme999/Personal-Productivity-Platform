import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FolderOpen, BookOpen, Target, ListTodo, ArrowRight } from 'lucide-react';
import { searchApi } from '@/api/endpoints';
import type { SearchResults } from '@/api/endpoints';
import { errorMessage } from '@/api/client';
import { PRIORITY_META, STATUS_META, RESOURCE_TYPE_META } from '@/lib/constants';
import { formatRelativeDay } from '@/lib/utils';
import { Badge } from '@/components/ui/Base';

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults(null);
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !query.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    setError(null);
    const t = setTimeout(async () => {
      try {
        const res = await searchApi.search(query.trim());
        setResults(res.data.data);
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, open]);

  if (!open) return null;

  const total = results
    ? (results.tasks?.total ?? 0) + (results.resources?.total ?? 0) + (results.words?.total ?? 0) + (results.goals?.total ?? 0)
    : 0;

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-slate-900/50 p-4 backdrop-blur-sm sm:pt-[12vh]" onClick={onClose}>
      <div
        className="animate-fade-up w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#141a2e]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 dark:border-white/5">
          <Search className="h-5 w-5 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, resources, vocabulary, goals…"
            className="flex-1 bg-transparent py-4 text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
          />
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {error && <p className="px-3 py-4 text-center text-sm text-red-500">{error}</p>}
          {loading && (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600/20 border-t-brand-600" />
            </div>
          )}
          {!loading && !error && results && total === 0 && (
            <p className="px-3 py-8 text-center text-sm text-slate-400">No results for “{query}”</p>
          )}

          {results && results.tasks && results.tasks.items.length > 0 && (
            <Group label={`Tasks · ${results.tasks.total}`}>
              {results.tasks.items.map((t) => (
                <ResultRow key={t.id} onClick={() => go('/tasks')} icon={<ListTodo className="h-4 w-4" />}>
                  <span className="flex-1 truncate">{t.title}</span>
                  <Badge className={STATUS_META[t.status].badge}>{STATUS_META[t.status].label}</Badge>
                  <Badge className={PRIORITY_META[t.priority].badge} dot={PRIORITY_META[t.priority].dot}>
                    {PRIORITY_META[t.priority].label}
                  </Badge>
                  {t.dueDate && <span className="text-xs text-slate-400">{formatRelativeDay(t.dueDate)}</span>}
                </ResultRow>
              ))}
            </Group>
          )}

          {results && results.resources && results.resources.items.length > 0 && (
            <Group label={`Resources · ${results.resources.total}`}>
              {results.resources.items.map((r) => (
                <ResultRow key={r.id} onClick={() => go('/resources')} icon={<FolderOpen className="h-4 w-4" />}>
                  <span className="flex-1 truncate">{r.title}</span>
                  <Badge className={RESOURCE_TYPE_META[r.type].badge}>{RESOURCE_TYPE_META[r.type].label}</Badge>
                </ResultRow>
              ))}
            </Group>
          )}

          {results && results.words && results.words.items.length > 0 && (
            <Group label={`Words · ${results.words.total}`}>
              {results.words.items.map((w) => (
                <ResultRow key={w.id} onClick={() => go('/english')} icon={<BookOpen className="h-4 w-4" />}>
                  <span className="font-medium">{w.word}</span>
                  <span className="flex-1 truncate text-slate-400">{w.meaning}</span>
                </ResultRow>
              ))}
            </Group>
          )}

          {results && results.goals && results.goals.items.length > 0 && (
            <Group label={`Goals · ${results.goals.total}`}>
              {results.goals.items.map((g) => (
                <ResultRow key={g.id} onClick={() => go('/goals')} icon={<Target className="h-4 w-4" />}>
                  <span className="flex-1 truncate">{g.title}</span>
                  <span className="text-xs text-slate-400">{g.progress}%</span>
                </ResultRow>
              ))}
            </Group>
          )}
        </div>
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="px-3 pb-1.5 pt-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}

function ResultRow({ children, onClick, icon }: { children: React.ReactNode; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
    >
      <span className="shrink-0 text-slate-400">{icon}</span>
      {children}
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
    </button>
  );
}
