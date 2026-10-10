import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import {
  devLoginSchema,
  googleAuthSchema,
  loginEmailSchema,
  registerEmailSchema,
  registerTelegramSchema,
  telegramValidateSchema,
  updateProfileSchema,
} from '../validators/auth.validator';

export const authRouter = Router();

// Telegram initData verification
authRouter.post('/telegram-validate', validate(telegramValidateSchema), authController.validateTelegram);

// Email & password authentication
authRouter.post('/register-email', validate(registerEmailSchema), authController.registerEmail);
authRouter.post('/login-email', validate(loginEmailSchema), authController.loginEmail);

// Google OAuth
authRouter.post('/google', validate(googleAuthSchema), authController.googleAuth);

// Telegram role registration
authRouter.post('/register', validate(registerTelegramSchema), authController.registerTelegram);

// User profile management
authRouter.get('/me', authMiddleware, authController.getProfile);
authRouter.put('/profile', authMiddleware, validate(updateProfileSchema), authController.updateProfile);

// Fast developer testing login
authRouter.post('/dev-login', validate(devLoginSchema), authController.devLogin);
