import { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env';

// Rate limiting is bypassed in tests so the suites can register many users.
const skipInTest: RequestHandler = (req, res, next) => next();

export const generalLimiter: RequestHandler =
  env.NODE_ENV === 'test'
    ? skipInTest
    : rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' },
  },
});

/** Stricter limiter for authentication endpoints. */
export const authLimiter: RequestHandler =
  env.NODE_ENV === 'test'
    ? skipInTest
    : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again in 15 minutes.' },
  },
});
