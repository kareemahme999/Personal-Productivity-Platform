export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type RecurrenceFrequency = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type ResourceType = 'LINK' | 'FILE' | 'NOTE';
export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type Theme = 'LIGHT' | 'DARK';

export interface User {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
  theme: Theme;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  _count?: { tasks: number; resources: number };
}

export interface Task {
  id: string;
  userId: string;
  categoryId?: string | null;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  startDate?: string | null;
  dueDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
  links: string[] | null;
  recurrence: RecurrenceFrequency;
  recurrenceInterval: number;
  recurrenceEndDate?: string | null;
  seriesId?: string | null;
  occurrenceIndex?: number | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  category?: Category | null;
  attachments?: TaskAttachment[];
}

export interface TaskAttachment {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType?: string | null;
}

export interface Resource {
  id: string;
  title: string;
  description?: string | null;
  url?: string | null;
  type: ResourceType;
  fileName?: string | null;
  filePath?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  categoryId?: string | null;
  category?: Category | null;
  createdAt: string;
}

export interface EnglishWord {
  id: string;
  word: string;
  meaning: string;
  exampleSentence?: string | null;
  pronunciation?: string | null;
  notes?: string | null;
  category?: string | null;
  isFavorite: boolean;
  isLearned: boolean;
  reviewCount: number;
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  scorePercent: number;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string | null;
  deadline?: string | null;
  progress: number;
  status: GoalStatus;
  category?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
