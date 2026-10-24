import { RequestHandler } from 'express';

type AsyncFn = (req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1], next: Parameters<RequestHandler>[2]) => Promise<unknown>;

export const asyncHandler =
  (fn: AsyncFn): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
