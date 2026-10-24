import { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { SearchModal } from './SearchModal';
import { Spinner } from '@/components/ui/Base';

export function AppLayout() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} onOpenSearch={() => setSearchOpen(true)} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
