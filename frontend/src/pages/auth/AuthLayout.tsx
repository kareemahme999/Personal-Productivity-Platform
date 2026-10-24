import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';

const missingApi = import.meta.env.PROD && !import.meta.env.VITE_API_URL;

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 dark:bg-[#0b1020]">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 shadow-xl shadow-brand-600/30">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-slate-800 dark:text-white">Aura</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Personal productivity & learning platform</p>
        </div>

        {missingApi && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            This GitHub Pages build has no API URL. Deploy the backend separately and set the
            repository variable <code className="font-mono">VITE_API_URL</code>, then rebuild.
          </div>
        )}

        <div className="card p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold text-slate-800 dark:text-white">{title}</h2>
          <p className="mb-6 mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          {children}
        </div>

        {footer && <div className="mt-4 text-center text-sm">{footer}</div>}
      </div>
    </div>
  );
}
