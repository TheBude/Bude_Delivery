import dotenv from 'dotenv';
import { APP_DEFAULTS } from '../constants/app.constants';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';

export const config = {
  nodeEnv,
  isDevelopment: nodeEnv === 'development',
  isProduction: nodeEnv === 'production',
  port: parseInt(process.env.PORT || String(APP_DEFAULTS.PORT), 10),
  jwtSecret: process.env.JWT_SECRET || 'bude_delivery_super_secure_jwt_secret_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || APP_DEFAULTS.JWT_EXPIRES_IN,
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || String(APP_DEFAULTS.BCRYPT_SALT_ROUNDS), 10),
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '7123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ',
  allowDevLogin: process.env.ALLOW_DEV_LOGIN !== 'false',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  databaseUrl: process.env.DATABASE_URL || '',
  defaultDeliveryFee: parseInt(process.env.DEFAULT_DELIVERY_FEE || String(APP_DEFAULTS.DELIVERY_FEE), 10),
  webAppUrl: process.env.WEB_APP_URL || 'https://bude-delivery.onrender.com',
} as const;
