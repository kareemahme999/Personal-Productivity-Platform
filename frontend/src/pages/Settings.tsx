import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon, KeyRound, Palette, Download, Upload, Database, Camera } from 'lucide-react';
import { authApi, backupApi } from '@/api/endpoints';
import { errorMessage, assetUrl } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Card, CardHeader } from '@/components/ui/Card';
import { Input, Select, Field, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { downloadBlob, downloadText, initials } from '@/lib/utils';
import type { ApiResponse } from '@/types';

export function SettingsPage() {
  const { user, refreshUser, setTheme, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const avatarRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreText, setRestoreText] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await authApi.updateProfileJson({ name: name.trim() });
      await refreshUser();
      success('Profile updated');
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const changeAvatar = async (file: File) => {
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await authApi.updateProfile(fd);
      await refreshUser();
      success('Profile picture updated');
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.newPassword.length < 8) {
      error('New password must be at least 8 characters');
      return;
    }
    if (pw.newPassword !== pw.confirm) {
      error('Passwords do not match');
      return;
    }
    setSavingPw(true);
    try {
      await authApi.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      success('Password changed. Please sign in again.');
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setSavingPw(false);
    }
  };

  const exportJson = async () => {
    setExporting(true);
    try {
      const res = await backupApi.exportJson();
      downloadText(
        JSON.stringify(res.data.data, null, 2),
        `aura-backup-${new Date().toISOString().slice(0, 10)}.json`,
        'application/json',
      );
      success('Backup exported');
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const exportCsv = async (table: 'tasks' | 'categories' | 'resources' | 'words' | 'goals') => {
    setExporting(true);
    try {
      const res = await backupApi.exportCsv(table);
      downloadBlob(res.data, `${table}-${new Date().toISOString().slice(0, 10)}.csv`);
      success(`Exported ${table}.csv`);
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const doRestore = async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(restoreText);
    } catch {
      error('Restore data must be valid JSON (paste the contents of a backup file)');
      return;
    }
    setRestoring(true);
    try {
      const res = await backupApi.restore(parsed as Record<string, unknown>);
      success((res.data as ApiResponse<unknown>).message ?? 'Backup restored');
      setRestoreText('');
      queryClient.invalidateQueries();
      await refreshUser();
    } catch (err) {
      error(errorMessage(err));
    } finally {
      setRestoring(false);
    }
  };

  const avatarUrl = user?.profileImage ? assetUrl(user.profileImage) : null;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account and data" icon={<SettingsIcon className="h-5 w-5" />} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Profile" />
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt={user?.name} className="h-24 w-24 rounded-full object-cover ring-4 ring-brand-600/20" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-600/10 font-display text-3xl font-bold text-brand-600 ring-4 ring-brand-600/20 dark:bg-brand-500/15 dark:text-brand-300">
                  {initials(user?.name ?? 'A')}
                </div>
              )}
              <button
                onClick={() => avatarRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition hover:bg-brand-500 disabled:opacity-50"
                aria-label="Change avatar"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) changeAvatar(f);
                  e.target.value = '';
                }}
              />
            </div>
            <div className="text-center">
              <p className="font-display text-lg font-semibold text-slate-800 dark:text-white">{user?.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
              <p className="mt-1 text-xs text-slate-400">Member since {user ? new Date(user.createdAt).toLocaleDateString() : ''}</p>
            </div>
          </div>

          <form onSubmit={saveProfile} className="mt-5 space-y-4">
            <Field label="Display name">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Button type="submit" loading={savingProfile} className="w-full">
              Save profile
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Appearance" />
          <div className="space-y-4">
            <Field label="Theme">
              <Select value={user?.theme ?? 'DARK'} onChange={(e) => setTheme(e.target.value as 'LIGHT' | 'DARK')}>
                <option value="DARK">Dark</option>
                <option value="LIGHT">Light</option>
              </Select>
            </Field>
            <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-white/5 dark:text-slate-400">
              <Palette className="mb-1 h-4 w-4 text-brand-500" />
              Changes apply immediately and are saved to your account.
            </p>
          </div>

          <form onSubmit={changePassword} className="mt-6 space-y-4 border-t border-slate-100 pt-5 dark:border-white/5">
            <h3 className="flex items-center gap-2 font-display text-base font-semibold text-slate-800 dark:text-white">
              <KeyRound className="h-4 w-4 text-brand-500" />
              Change password
            </h3>
            <Field label="Current password">
              <Input type="password" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
            </Field>
            <Field label="New password" hint="At least 8 characters">
              <Input type="password" required value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
            </Field>
            <Field label="Confirm new password">
              <Input type="password" required value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
            </Field>
            <Button type="submit" variant="secondary" loading={savingPw} className="w-full">
              Update password
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Data & backup" />
          <div className="space-y-4">
            <div>
              <p className="label">Export data (JSON)</p>
              <Button variant="secondary" className="w-full" loading={exporting} onClick={exportJson}>
                <Download className="h-4 w-4" />
                Export full backup
              </Button>
            </div>
            <div>
              <p className="label">Export CSV</p>
              <div className="grid grid-cols-2 gap-2">
                {(['tasks', 'resources', 'words', 'goals', 'categories'] as const).map((t) => (
                  <Button key={t} variant="secondary" size="sm" className="w-full" onClick={() => exportCsv(t)}>
                    {t}
                  </Button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-dashed border-slate-300 p-4 dark:border-white/10">
              <p className="label !mb-2 flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5" /> Restore from JSON
              </p>
              <p className="mb-2 text-xs text-slate-400">
                Paste the contents of a backup file. New records are created; duplicates are skipped.
              </p>
              <Textarea
                className="!min-h-[80px] font-mono !text-xs"
                placeholder='{"tasks": [], "categories": [], …}'
                value={restoreText}
                onChange={(e) => setRestoreText(e.target.value)}
              />
              <Button className="mt-2 w-full" variant="secondary" loading={restoring} disabled={!restoreText.trim()} onClick={doRestore}>
                <Database className="h-4 w-4" />
                Restore data
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
