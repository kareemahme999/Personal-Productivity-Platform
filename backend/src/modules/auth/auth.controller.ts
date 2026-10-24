import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import * as authService from './auth.service';
import { env, REFRESH_TOKEN_TTL_MS } from '../../config/env';

const REFRESH_COOKIE = 'aura_refresh';

/**
 * Production frontend (GitHub Pages) and API are different sites, so the
 * refresh cookie must be SameSite=None; Secure to be sent cross-origin.
 */
function refreshCookieOptions() {
  const crossSite = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: crossSite,
    sameSite: (crossSite ? 'none' : 'lax') as 'none' | 'lax',
    path: '/api/auth',
    maxAge: REFRESH_TOKEN_TTL_MS,
  };
}

function setRefreshCookie(res: Response, value: string) {
  res.cookie(REFRESH_COOKIE, value, refreshCookieOptions());
}

function clearRefreshCookie(res: Response) {
  const { maxAge: _maxAge, ...opts } = refreshCookieOptions();
  res.clearCookie(REFRESH_COOKIE, opts);
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  setRefreshCookie(res, result.refreshRaw);
  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: { user: result.user, accessToken: result.accessToken },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  setRefreshCookie(res, result.refreshRaw);
  res.status(200).json({
    success: true,
    message: 'Welcome back!',
    data: { user: result.user, accessToken: result.accessToken },
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  await authService.logout(token);
  clearRefreshCookie(res);
  res.status(200).json({ success: true, message: 'Logged out successfully', data: null });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (!token) throw ApiError.unauthorized('No refresh token provided');
  const result = await authService.refreshTokens(token);
  setRefreshCookie(res, result.refreshRaw);
  res.status(200).json({
    success: true,
    data: { user: result.user, accessToken: result.accessToken },
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id);
  res.status(200).json({ success: true, data: { user } });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user!.id, currentPassword, newPassword);
  clearRefreshCookie(res);
  res.status(200).json({ success: true, message: 'Password changed. Please sign in again.', data: null });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.forgotPassword(req.body.email);
  res.status(200).json({
    success: true,
    message: result.delivered
      ? 'If that email exists, a reset link has been sent.'
      : 'If that email exists, a reset link has been sent.',
    ...(env.NODE_ENV !== 'production' && result.resetUrl
      ? { data: { devResetUrl: result.resetUrl } }
      : { data: null }),
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.token, req.body.password);
  res.status(200).json({ success: true, message: 'Password reset successfully. You can now sign in.', data: null });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  const user = await authService.updateProfile(
    req.user!.id,
    req.body,
    file ? { filename: file.filename, mimetype: file.mimetype, size: file.size } : undefined,
  );
  res.status(200).json({ success: true, message: 'Profile updated', data: { user } });
});
