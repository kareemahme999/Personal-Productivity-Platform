import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '@/api/endpoints';
import { errorMessage } from '@/api/client';
import { AuthLayout } from './AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export function ForgotPasswordPage() {
  const { success, error } = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [devUrl, setDevUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authApi.forgotPassword({ email: email.trim() });
      setDevUrl(res.data.data?.devResetUrl ?? null);
      setSent(true);
      success('Password reset link sent');
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a link to reset your password">
      {sent ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            If an account exists for <strong>{email}</strong>, a reset link has been sent. Check your inbox.
          </p>
          {devUrl && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              <p className="mb-1 font-semibold">Dev mode — reset link (no SMTP configured):</p>
              <a href={devUrl} className="break-all font-mono text-xs underline">
                {devUrl}
              </a>
            </div>
          )}
          <Link to="/login" className="btn-secondary w-full">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Email">
            <Input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Button type="submit" loading={submitting} className="w-full">
            Send reset link
          </Button>
          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            Remembered it?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
              Sign in
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
