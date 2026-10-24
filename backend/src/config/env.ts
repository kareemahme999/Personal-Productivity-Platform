import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  API_URL: z.string().default('http://localhost:5000'),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  MAIL_FROM: z.string().default('Aura <noreply@example.com>'),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(10),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(200),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables. Check the .env file.');
}

export const env = parsed.data;

/** Parse values like `15m`, `30d`, `12h` into milliseconds. */
export function parseDurationMs(value: string, fallbackMs: number): number {
  const match = /^(\d+)\s*([smhd])$/i.exec(value.trim());
  if (!match) return fallbackMs;
  const n = Number(match[1]);
  const unit = match[2].toLowerCase();
  const map: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return n * (map[unit] ?? fallbackMs);
}

export const REFRESH_TOKEN_TTL_MS = parseDurationMs(env.JWT_REFRESH_EXPIRES_IN, 30 * 24 * 60 * 60 * 1000);
