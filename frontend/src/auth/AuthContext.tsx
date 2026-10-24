import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '@/api/endpoints';
import { errorMessage } from '@/api/client';
import { setStoredToken } from '@/api/client';
import type { User } from '@/types';
import { THEME_KEY } from '@/lib/constants';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setTheme: (theme: 'LIGHT' | 'DARK') => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function applyTheme(theme: 'LIGHT' | 'DARK') {
  const root = document.documentElement;
  if (theme === 'DARK') root.classList.add('dark');
  else root.classList.remove('dark');
  localStorage.setItem(THEME_KEY, theme);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.me();
      setUser(res.data.data.user);
      applyTheme(res.data.data.user.theme);
    } catch {
      setUser(null);
      setStoredToken(null);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'LIGHT' || saved === 'DARK') applyTheme(saved);
    else applyTheme('DARK');

    let mounted = true;
    (async () => {
      try {
        const res = await authApi.me();
        if (!mounted) return;
        setUser(res.data.data.user);
        applyTheme(res.data.data.user.theme);
      } catch {
        if (!mounted) return;
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const onLogout = () => setUser(null);
    window.addEventListener('auth:logout', onLogout);
    return () => {
      mounted = false;
      window.removeEventListener('auth:logout', onLogout);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setStoredToken(res.data.data.accessToken);
    setUser(res.data.data.user);
    applyTheme(res.data.data.user.theme);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await authApi.register({ name, email, password });
    setStoredToken(res.data.data.accessToken);
    setUser(res.data.data.user);
    applyTheme(res.data.data.user.theme);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore network errors during logout */
    }
    setStoredToken(null);
    setUser(null);
  }, []);

  const setTheme = useCallback((theme: 'LIGHT' | 'DARK') => {
    applyTheme(theme);
    setUser((prev) => (prev ? { ...prev, theme } : prev));
    if (user) {
      authApi.updateProfileJson({ theme }).catch(() => undefined);
    }
  }, [user]);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser, setTheme }),
    [user, loading, login, register, logout, refreshUser, setTheme],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function authErrorMessage(error: unknown): string {
  return errorMessage(error, 'Authentication failed');
}
