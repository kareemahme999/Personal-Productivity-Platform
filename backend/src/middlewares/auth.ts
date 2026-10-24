import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../utils/tokens';
import { prisma } from '../lib/prisma';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
      };
    }
  }
}

/**
 * Authentication middleware. Requires a valid `Authorization: Bearer <token>`.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Access token missing');
    }

    const token = header.slice(7);
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw ApiError.unauthorized('Invalid or expired access token');
    }

    if (payload.type !== 'access') {
      throw ApiError.unauthorized('Invalid token type');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      throw ApiError.unauthorized('User no longer exists');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
