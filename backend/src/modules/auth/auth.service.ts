import { AuthToken, TokenType, User } from '@prisma/client';
import { addMinutes } from 'date-fns';
import { env, REFRESH_TOKEN_TTL_MS } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { generateRandomToken, hashToken } from '../../utils/crypto';
import { sendMail } from '../../utils/mail';
import { hashPassword, verifyPassword } from '../../utils/password';
import { signAccessToken } from '../../utils/tokens';

export interface AuthResult {
  user: SafeUser;
  accessToken: string;
  refreshRaw: string;
}

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
  theme: 'LIGHT' | 'DARK';
  createdAt: Date;
};

export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    profileImage: user.profileImage,
    theme: user.theme,
    createdAt: user.createdAt,
  };
}

/**
 * Create an opaque refresh token (session id). Only its SHA-256 hash is
 * persisted; the raw value is returned exactly once to be stored in an
 * httpOnly cookie.
 */
export async function createRefreshTokenRow(userId: string): Promise<{ raw: string; token: AuthToken }> {
  const raw = generateRandomToken(48);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  const token = await prisma.authToken.create({
    data: {
      userId,
      tokenHash: hashToken(raw),
      type: TokenType.REFRESH,
      expiresAt,
    },
  });
  return { raw, token };
}

export async function register(input: { name: string; email: string; password: string }): Promise<AuthResult> {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { name: input.name.trim(), email, passwordHash },
  });

  const { raw } = await createRefreshTokenRow(user.id);
  const accessToken = signAccessToken({ sub: user.id, email: user.email });

  return { user: toSafeUser(user), accessToken, refreshRaw: raw };
}

export async function login(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const { raw } = await createRefreshTokenRow(user.id);
  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  return { user: toSafeUser(user), accessToken, refreshRaw: raw };
}

export async function logout(refreshTokenRaw?: string) {
  if (!refreshTokenRaw) return;
  await prisma.authToken.updateMany({
    where: { tokenHash: hashToken(refreshTokenRaw), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function refreshTokens(refreshTokenRaw: string) {
  const stored = await prisma.authToken.findUnique({ where: { tokenHash: hashToken(refreshTokenRaw) } });
  if (!stored || stored.type !== TokenType.REFRESH || stored.revokedAt || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized('Refresh token is no longer valid');
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) throw ApiError.unauthorized('User no longer exists');

  // Rotate: revoke the old row, create a new one.
  await prisma.authToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
  const { raw } = await createRefreshTokenRow(user.id);
  const accessToken = signAccessToken({ sub: user.id, email: user.email });

  return { user: toSafeUser(user), accessToken, refreshRaw: raw };
}

export async function getMe(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User');
  return toSafeUser(user);
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User');

  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) throw ApiError.badRequest('Current password is incorrect');

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  // Revoke all refresh sessions for security.
  await prisma.authToken.updateMany({ where: { userId }, data: { revokedAt: new Date() } });
}

export async function forgotPassword(email: string): Promise<{ delivered: boolean; resetUrl?: string }> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  // Always succeed to avoid leaking which emails exist.
  if (!user) return { delivered: false };

  const raw = generateRandomToken(32);
  const expiresAt = addMinutes(new Date(), 60);
  await prisma.authToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(raw),
      type: TokenType.PASSWORD_RESET,
      expiresAt,
    },
  });

  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${raw}`;
  const { delivered } = await sendMail({
    to: user.email,
    subject: 'Reset your Aura password',
    text: `You requested a password reset. Open this link within 60 minutes:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
  });

  // In development there is no SMTP, so we echo the reset URL to the caller
  // so the flow stays usable locally. In production the URL is only emailed.
  const devEcho = env.NODE_ENV !== 'production' ? resetUrl : undefined;
  return { delivered, resetUrl: devEcho };
}

export async function resetPassword(token: string, newPassword: string) {
  const stored = await prisma.authToken.findFirst({
    where: { tokenHash: hashToken(token), type: TokenType.PASSWORD_RESET, revokedAt: null },
  });
  if (!stored || stored.expiresAt < new Date()) {
    throw ApiError.badRequest('Reset token is invalid or has expired');
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: stored.userId }, data: { passwordHash } });
  await prisma.authToken.updateMany({ where: { id: stored.id }, data: { revokedAt: new Date() } });
  // Revoke all refresh sessions.
  await prisma.authToken.updateMany({ where: { userId: stored.userId }, data: { revokedAt: new Date() } });
}

export async function updateProfile(
  userId: string,
  data: { name?: string; theme?: 'LIGHT' | 'DARK' },
  file?: { filename: string; mimetype: string; size: number },
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User');

  const profileImage = file ? `${env.UPLOAD_DIR}/profiles/${file.filename}` : undefined;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name !== undefined ? data.name.trim() : undefined,
      theme: data.theme !== undefined ? data.theme : undefined,
      ...(profileImage ? { profileImage } : {}),
    },
  });
  return toSafeUser(updated);
}
