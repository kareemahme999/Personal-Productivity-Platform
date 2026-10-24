import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ListTodo, CalendarDays, FolderOpen, BookOpen, Target, BarChart3, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/auth/AuthContext';
import { assetUrl } from '@/api/client';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/resources', label: 'Resources', icon: FolderOpen },
  { to: '/english', label: 'English', icon: BookOpen },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/statistics', label: 'Statistics', icon: BarChart3 },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const firstName = user?.name.split(' ')[0] ?? 'User';

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform dark:border-white/5 dark:bg-[#0b1020] lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 font-display text-lg font-bold text-white">
              A
            </div>
            <span className="font-display text-xl font-bold text-slate-800 dark:text-white">Aura</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden dark:hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) => cn('nav-item', isActive && 'nav-item-active')}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4 dark:border-white/5">
          <div className="flex items-center gap-3">
            {user?.profileImage ? (
              <img src={assetUrl(user.profileImage)} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600/10 font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                {user?.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{user?.name}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">Welcome, {firstName} 👋</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
