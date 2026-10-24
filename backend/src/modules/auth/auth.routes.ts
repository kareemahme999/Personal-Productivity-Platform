import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { authLimiter } from '../../middlewares/rateLimiter';
import { createUploader } from '../../middlewares/upload';
import * as authController from './auth.controller';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from './auth.validation';

const router = Router();
const profileUploader = createUploader('profiles');

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

router.use(authenticate);
router.get('/me', authController.me);
router.post('/change-password', validate(changePasswordSchema), authController.changePassword);
router.patch('/profile', profileUploader.single('profileImage'), validate(updateProfileSchema), authController.updateProfile);

export default router;
