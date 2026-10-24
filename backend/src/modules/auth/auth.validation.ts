import { z } from 'zod';

const email = z.string().trim().email('A valid email is required').max(254);
const name = z.string().trim().min(2, 'Name must be at least 2 characters').max(120);
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const registerSchema = z.object({
  name,
  email,
  password,
});

export const loginSchema = z.object({
  email: z.string().trim().email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: password,
});

export const forgotPasswordSchema = z.object({
  email: email,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password,
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  theme: z.enum(['LIGHT', 'DARK']).optional(),
});
