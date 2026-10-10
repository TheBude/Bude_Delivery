import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'bude_delivery_super_secure_jwt_secret_key_2026',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '7123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ',
  allowDevLogin: process.env.ALLOW_DEV_LOGIN !== 'false',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  databaseUrl: process.env.DATABASE_URL || '',
};
