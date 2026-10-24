import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodSchema } from 'zod';
import { ApiError } from '../utils/ApiError';

type Source = 'body' | 'query' | 'params';

/**
 * Validate a request part against a Zod schema. On success the validated
 * (parsed) value replaces the original part.
 */
export function validate(schema: ZodSchema, source: Source = 'body'): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      return next(ApiError.badRequest('Validation failed', issues));
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any)[source] = result.data;
    next();
  };
}
