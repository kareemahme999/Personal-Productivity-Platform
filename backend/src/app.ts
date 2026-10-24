import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import path from 'node:path';
import { env } from './config/env';
import authRoutes from './modules/auth/auth.routes';
import taskRoutes from './modules/tasks/task.routes';
import categoryRoutes from './modules/categories/category.routes';
import resourceRoutes from './modules/resources/resource.routes';
import englishRoutes from './modules/english/english.routes';
import goalRoutes from './modules/goals/goal.routes';
import statisticsRoutes from './modules/statistics/statistics.routes';
import searchRoutes from './modules/search/search.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import backupRoutes from './modules/backup/backup.routes';
import { errorHandler } from './middlewares/errorHandler';
import { generalLimiter } from './middlewares/rateLimiter';

export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  const corsOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin(origin, callback) {
        // Allow requests without an origin (curl, mobile, same-origin).
        if (!origin || corsOrigins.includes(origin)) return callback(null, true);
        return callback(null, false);
      },
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());

  // Serve uploaded files statically at /uploads/...
  app.use(
    `/${env.UPLOAD_DIR}`,
    express.static(path.resolve(process.cwd(), env.UPLOAD_DIR), {
      maxAge: '7d',
      fallthrough: false,
    }),
  );

  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({ success: true, data: { status: 'ok', uptime: process.uptime() } });
  });

  app.use('/api', generalLimiter);

  app.use('/api/auth', authRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/resources', resourceRoutes);
  app.use('/api/english', englishRoutes);
  app.use('/api/goals', goalRoutes);
  app.use('/api/statistics', statisticsRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/backup', backupRoutes);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });

  app.use(errorHandler);

  return app;
}
