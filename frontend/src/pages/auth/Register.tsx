import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { authErrorMessage } from '@/auth/AuthContext';
import { AuthLayout } from './AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8 || !/[a-zA-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      error('Password must be at least 8 characters and include a letter and a number');
      return;
    }
    if (form.password !== form.confirm) {
      error('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      success('Account created — welcome to Aura!');
      navigate('/', { replace: true });
    } catch (err) {
      error(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start organizing tasks and learning in minutes">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Full name">
          <Input
            required
            placeholder="Amira Hassan"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
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
        <Field label="Password" hint="At least 8 characters, including a letter and a number">
          <Input
            type="password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>
        <Field label="Confirm password">
          <Input
            type="password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          />
        </Field>
        <Button type="submit" loading={submitting} className="w-full">
          Create account
        </Button>
      </form>
      <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
