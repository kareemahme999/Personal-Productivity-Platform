import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/auth/Login';
import { RegisterPage } from '@/pages/auth/Register';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPassword';
import { ResetPasswordPage } from '@/pages/auth/ResetPassword';
import { DashboardPage } from '@/pages/Dashboard';
import { TasksPage } from '@/pages/Tasks';
import { CalendarPage } from '@/pages/Calendar';
import { ResourcesPage } from '@/pages/Resources';
import { EnglishPage } from '@/pages/English';
import { QuizPage } from '@/pages/Quiz';
import { GoalsPage } from '@/pages/Goals';
import { StatisticsPage } from '@/pages/Statistics';
import { NotificationsPage } from '@/pages/Notifications';
import { SettingsPage } from '@/pages/Settings';
import { Spinner } from '@/components/ui/Base';

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

function PublicOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter basename={routerBasename === '/' ? undefined : routerBasename}>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
            <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
            <Route path="/forgot-password" element={<PublicOnly><ForgotPasswordPage /></PublicOnly>} />
            <Route path="/reset-password" element={<PublicOnly><ResetPasswordPage /></PublicOnly>} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/english" element={<EnglishPage />} />
              <Route path="/english/quiz" element={<QuizPage />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
