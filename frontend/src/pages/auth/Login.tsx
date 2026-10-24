import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { authErrorMessage } from '@/auth/AuthContext';
import { AuthLayout } from './AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
      success('Welcome back to Aura!');
      navigate('/', { replace: true });
    } catch (err) {
      error(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue to your dashboard">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email">
          <Input
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" loading={submitting} className="w-full">
          Sign in
        </Button>
      </form>
      <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        New to Aura?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
          Create an account
        </Link>
      </div>
    </AuthLayout>
  );
}
