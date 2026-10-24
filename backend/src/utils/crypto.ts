import { createHmac, randomBytes } from 'node:crypto';
import { env } from '../config/env';

/**
 * Hash a token so plaintext tokens are never stored in the database.
 * HMAC uses JWT_REFRESH_SECRET so leaked hashes cannot be brute-forced
 * independently of the server secret.
 */
export function hashToken(token: string): string {
  return createHmac('sha256', env.JWT_REFRESH_SECRET).update(token).digest('hex');
}

/**
 * Generate a cryptographically secure random token (e.g. for refresh or
 * password reset tokens).
 */
export function generateRandomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export const SHA256 = hashToken;
