import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import type { ApiErrorBody } from '@/types';

const baseURL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const client = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30000,
});

const TOKEN_KEY = 'aura_access_token';
let refreshPromise: Promise<string | null> | null = null;

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/** Resolve a stored upload path (relative or absolute) against the API origin. */
export function assetUrl(stored?: string | null): string {
  if (!stored) return '';
  if (/^https?:\/\//i.test(stored)) {
    try {
      const url = new URL(stored);
      if (baseURL && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
        return `${baseURL}${url.pathname}`;
      }
    } catch {
      return stored;
    }
    return stored;
  }
  const path = stored.startsWith('/') ? stored : `/${stored}`;
  return `${baseURL}${path}`;
}

client.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

async function tryRefresh(): Promise<string | null> {
  try {
    const res = await axios.post<{ success: boolean; data: { accessToken: string } }>(
      `${baseURL}/api/auth/refresh`,
      {},
      { withCredentials: true },
    );
    const token = res.data.data.accessToken;
    setStoredToken(token);
    return token;
  } catch {
    setStoredToken(null);
    return null;
  }
}

const SKIP_REFRESH = /\/api\/auth\/(login|register|refresh|logout|forgot-password|reset-password)(?:\?|$)/;

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';
    const skipRefresh = SKIP_REFRESH.test(url);

    if (status === 401 && original && !original._retry && !skipRefresh) {
      original._retry = true;
      refreshPromise = refreshPromise ?? tryRefresh();
      const token = await refreshPromise;
      refreshPromise = null;
      if (token) {
        original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
        return client(original);
      }
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    return Promise.reject(error);
  },
);

/** Extract a user-friendly message from an Axios error. */
export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.error?.message) return body.error.message;
    if (error.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the backend running?';
    if (error.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
