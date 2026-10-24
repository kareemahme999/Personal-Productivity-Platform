import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '@/api/endpoints';
import { errorMessage } from '@/api/client';
import { AuthLayout } from './AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      error('Passwords do not match');
      return;
    }
    if (!token) {
      error('Reset token is missing from the URL');
      return;
    }
    setSubmitting(true);
    try {
      await authApi.resetPassword({ token, password });
      success('Password updated — you can sign in now');
      navigate('/login', { replace: true });
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Choose a new password" subtitle="Set a new password for your account">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="New password" hint="At least 8 characters">
          <Input
            type="password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="Confirm new password">
          <Input
            type="password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
        <Button type="submit" loading={submitting} className="w-full">
          Update password
        </Button>
        <div className="text-center text-sm text-slate-500 dark:text-slate-400">
          <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
            Back to sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
