import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  type: 'access';
}

export function signAccessToken(payload: { sub: string; email: string }): string {
  return jwt.sign({ ...payload, type: 'access' } satisfies AccessTokenPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}
