import { client } from './client';
import type { ApiResponse, Category, EnglishWord, Goal, Pagination, QuizAttempt, Resource, Task, TaskStatus, TaskPriority, RecurrenceFrequency, User, GoalStatus, ResourceType } from '@/types';

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    client.post<ApiResponse<{ user: User; accessToken: string }>>('/api/auth/register', data),
  login: (data: { email: string; password: string }) =>
    client.post<ApiResponse<{ user: User; accessToken: string }>>('/api/auth/login', data),
  logout: () => client.post<ApiResponse<null>>('/api/auth/logout'),
  me: () => client.get<ApiResponse<{ user: User }>>('/api/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    client.post<ApiResponse<null>>('/api/auth/change-password', data),
  forgotPassword: (data: { email: string }) =>
    client.post<ApiResponse<{ devResetUrl?: string } | null>>('/api/auth/forgot-password', data),
  resetPassword: (data: { token: string; password: string }) =>
    client.post<ApiResponse<null>>('/api/auth/reset-password', data),
  updateProfile: (data: FormData) =>
    client.patch<ApiResponse<{ user: User }>>('/api/auth/profile', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateProfileJson: (data: { name?: string; theme?: 'LIGHT' | 'DARK' }) =>
    client.patch<ApiResponse<{ user: User }>>('/api/auth/profile', data),
};

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const categoriesApi = {
  list: () => client.get<ApiResponse<{ categories: Category[] }>>('/api/categories'),
  create: (data: Partial<Category>) => client.post<ApiResponse<{ category: Category }>>('/api/categories', data),
  update: (id: string, data: Partial<Category>) => client.put<ApiResponse<{ category: Category }>>(`/api/categories/${id}`, data),
  remove: (id: string) => client.delete<ApiResponse<null>>(`/api/categories/${id}`),
};

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export interface TaskQuery {
  status?: TaskStatus;
  priority?: TaskPriority;
  categoryId?: string;
  q?: string;
  dueFrom?: string;
  dueTo?: string;
  completed?: boolean;
  page?: number;
  limit?: number;
}

export interface TaskPayload {
  title: string;
  description?: string | null;
  categoryId?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  startDate?: string | null;
  dueDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
  links?: string[];
  recurrence?: RecurrenceFrequency;
  recurrenceInterval?: number;
  recurrenceEndDate?: string | null;
  applyTo?: 'this' | 'series';
}

export const tasksApi = {
  list: (params: TaskQuery = {}) =>
    client.get<ApiResponse<{ tasks: Task[]; pagination: Pagination }>>('/api/tasks', { params }),
  get: (id: string) => client.get<ApiResponse<{ task: Task; occurrences: Task[] | null }>>(`/api/tasks/${id}`),
  create: (data: TaskPayload) => client.post<ApiResponse<{ task: Task; occurrences: Task[] | null }>>('/api/tasks', data),
  update: (id: string, data: TaskPayload) => client.put<ApiResponse<{ task: Task; occurrences: Task[] | null }>>(`/api/tasks/${id}`, data),
  complete: (id: string, completed: boolean) => client.patch<ApiResponse<{ task: Task }>>(`/api/tasks/${id}/complete`, { completed }),
  remove: (id: string, mode: 'this' | 'series' = 'this') => client.delete<ApiResponse<null>>(`/api/tasks/${id}`, { params: { mode } }),
};

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

export interface ResourcePayload {
  title: string;
  description?: string | null;
  url?: string | null;
  type?: ResourceType;
  categoryId?: string | null;
}

export const resourcesApi = {
  list: (params: { type?: ResourceType; categoryId?: string; q?: string; page?: number; limit?: number } = {}) =>
    client.get<ApiResponse<{ resources: Resource[]; pagination: Pagination }>>('/api/resources', { params }),
  create: (data: ResourcePayload, file?: File) => {
    if (file) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', data.title);
      if (data.description) fd.append('description', data.description);
      if (data.categoryId) fd.append('categoryId', data.categoryId);
      return client.post<ApiResponse<{ resource: Resource }>>('/api/resources', fd);
    }
    return client.post<ApiResponse<{ resource: Resource }>>('/api/resources', data);
  },
  update: (id: string, data: ResourcePayload, file?: File) => {
    if (file) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', data.title);
      if (data.description) fd.append('description', data.description);
      if (data.categoryId) fd.append('categoryId', data.categoryId);
      return client.put<ApiResponse<{ resource: Resource }>>(`/api/resources/${id}`, fd);
    }
    return client.put<ApiResponse<{ resource: Resource }>>(`/api/resources/${id}`, data);
  },
  remove: (id: string) => client.delete<ApiResponse<null>>(`/api/resources/${id}`),
};

// ---------------------------------------------------------------------------
// English
// ---------------------------------------------------------------------------

export interface WordPayload {
  word: string;
  meaning: string;
  exampleSentence?: string | null;
  pronunciation?: string | null;
  notes?: string | null;
  category?: string | null;
  isFavorite?: boolean;
  isLearned?: boolean;
}

export const englishApi = {
  list: (params: { q?: string; category?: string; favorite?: boolean; learned?: boolean; random?: boolean; page?: number; limit?: number } = {}) =>
    client.get<ApiResponse<{ words: EnglishWord[]; pagination: Pagination }>>('/api/english/words', { params }),
  categories: () => client.get<ApiResponse<{ categories: string[] }>>('/api/english/words/categories'),
  wordOfDay: () => client.get<ApiResponse<{ word: EnglishWord | null }>>('/api/english/words/word-of-day'),
  create: (data: WordPayload) => client.post<ApiResponse<{ word: EnglishWord }>>('/api/english/words', data),
  update: (id: string, data: Partial<WordPayload>) => client.put<ApiResponse<{ word: EnglishWord }>>(`/api/english/words/${id}`, data),
  learned: (id: string, data: { isLearned?: boolean; isFavorite?: boolean }) =>
    client.patch<ApiResponse<{ word: EnglishWord }>>(`/api/english/words/${id}/learned`, data),
  remove: (id: string) => client.delete<ApiResponse<null>>(`/api/english/words/${id}`),
  quizQuestions: (count = 10, mode = 'all') =>
    client.get<ApiResponse<{ questions: QuizQuestion[] }>>('/api/english/quiz/questions', { params: { count, mode } }),
  quizSubmit: (data: { totalQuestions: number; correctAnswers: number; wrongAnswers: number; details: unknown }) =>
    client.post<ApiResponse<{ attempt: QuizAttempt }>>('/api/english/quiz/submit', data),
  quizHistory: () => client.get<ApiResponse<{ attempts: QuizAttempt[] }>>('/api/english/quiz/history'),
};

export interface QuizQuestion {
  wordId: string;
  word: string;
  meaning: string;
  type: 'to_arabic' | 'to_english';
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export interface GoalPayload {
  title: string;
  description?: string | null;
  deadline?: string | null;
  progress?: number;
  status?: GoalStatus;
  category?: string | null;
}

export const goalsApi = {
  list: (params: { status?: GoalStatus; q?: string; page?: number; limit?: number } = {}) =>
    client.get<ApiResponse<{ goals: Goal[]; pagination: Pagination }>>('/api/goals', { params }),
  create: (data: GoalPayload) => client.post<ApiResponse<{ goal: Goal }>>('/api/goals', data),
  update: (id: string, data: Partial<GoalPayload>) => client.put<ApiResponse<{ goal: Goal }>>(`/api/goals/${id}`, data),
  remove: (id: string) => client.delete<ApiResponse<null>>(`/api/goals/${id}`),
};

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

export interface DashboardData {
  tasks: {
    todayTasks: number;
    completedToday: number;
    pending: number;
    overdue: number;
    total: number;
    completed: number;
    completionRate: number;
    currentStreak: number;
    longestStreak: number;
  };
  goals: { active: number; completed: number };
  upcomingDeadlines: Task[];
  recentResources: Resource[];
  recentWords: EnglishWord[];
  vocabulary: { total: number; learned: number; favorites: number; learningProgress: number };
  quiz: QuizAttempt[];
}

export interface TaskStatsData {
  byStatus: { status: TaskStatus; _count: { _all: number } }[];
  byPriority: { priority: TaskPriority; _count: { _all: number } }[];
  byCategory: { categoryId: string | null; name: string; color: string; count: number }[];
  dailyCompletion: { date: string; count: number }[];
}

export interface ProductivityData {
  today: number;
  last30Days: number;
  last365Days: number;
  allTime: number;
  currentStreak: number;
  longestStreak: number;
  weeklyTrend: { label: string; completed: number; created: number }[];
}

export interface VocabularyStatsData {
  total: number;
  learned: number;
  favorites: number;
  unlearned: number;
  learnedThisWeek: number;
  learningProgress: number;
  quiz: { attemptCount: number; avgScore: number; bestScore: number; recent: { date: string; score: number; correct: number; total: number }[] };
}

export const statisticsApi = {
  dashboard: () => client.get<ApiResponse<DashboardData>>('/api/statistics/dashboard'),
  tasks: () => client.get<ApiResponse<TaskStatsData>>('/api/statistics/tasks'),
  productivity: () => client.get<ApiResponse<ProductivityData>>('/api/statistics/productivity'),
  vocabulary: () => client.get<ApiResponse<VocabularyStatsData>>('/api/statistics/vocabulary'),
};

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface SearchResults {
  query: string;
  tasks?: { items: Task[]; total: number };
  resources?: { items: Resource[]; total: number };
  words?: { items: EnglishWord[]; total: number };
  goals?: { items: Goal[]; total: number };
}

export const searchApi = {
  search: (q: string, types?: string[], limit = 5) =>
    client.get<ApiResponse<SearchResults>>('/api/search', { params: { q, types: types?.join(','), limit } }),
};

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface NotificationsData {
  summary: { dueToday: number; dueTomorrow: number; upcoming: number; overdue: number };
  dueToday: Task[];
  dueTomorrow: Task[];
  upcoming: Task[];
  overdue: Task[];
}

export const notificationsApi = {
  list: () => client.get<ApiResponse<NotificationsData>>('/api/notifications'),
};

// ---------------------------------------------------------------------------
// Backup
// ---------------------------------------------------------------------------

export const backupApi = {
  exportJson: () => client.get<ApiResponse<Record<string, unknown>>>('/api/backup/export'),
  exportCsv: (table: 'tasks' | 'categories' | 'resources' | 'words' | 'goals') =>
    client.get<Blob>(`/api/backup/export/${table}/csv`, { responseType: 'blob' }),
  restore: (data: Record<string, unknown>) => client.post<ApiResponse<Record<string, number>>>('/api/backup/restore', data),
};
