import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, Moon, Sun, LogOut } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { assetUrl } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '@/api/endpoints';
import { useToast } from '@/components/ui/Toast';

export function Topbar({ onOpenSidebar, onOpenSearch }: { onOpenSidebar: () => void; onOpenSearch: () => void }) {
  const { user, logout, setTheme } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: notif } = useQuery({
    queryKey: ['notifications', 'summary'],
    queryFn: () => notificationsApi.list().then((r) => r.data.data),
    refetchInterval: 60_000,
  });

  const alerts = (notif?.overdue.length ?? 0) + (notif?.dueToday.length ?? 0);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      error('Failed to log out');
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-lg dark:border-white/5 dark:bg-[#0b1020]/80 lg:px-6">
      <button onClick={onOpenSidebar} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-white/10">
        <Menu className="h-5 w-5" />
      </button>

      <button
        onClick={onOpenSearch}
        className="flex w-full max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-400 transition hover:border-brand-400 focus:border-brand-500 dark:border-white/10 dark:bg-white/5 dark:hover:border-brand-500/50"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search tasks, resources, words…</span>
        <kbd className="hidden rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:block dark:border-white/10">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={() => navigate('/notifications')}
          className="relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {alerts > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {alerts}
            </span>
          )}
        </button>

        <button
          onClick={() => setTheme(user?.theme === 'DARK' ? 'LIGHT' : 'DARK')}
          className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200"
          aria-label="Toggle theme"
        >
          {user?.theme === 'DARK' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-brand-600/10 font-semibold text-brand-600 ring-2 ring-transparent transition hover:ring-brand-600/30 dark:bg-brand-500/15 dark:text-brand-300"
            aria-label="Account menu"
          >
            {user?.profileImage ? (
              <img src={assetUrl(user.profileImage)} alt="" className="h-full w-full object-cover" />
            ) : (
              user?.name.charAt(0).toUpperCase()
            )}
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#141a2e]">
                <div className="border-b border-slate-100 px-4 py-3 dark:border-white/5">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{user?.name}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"
                >
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
