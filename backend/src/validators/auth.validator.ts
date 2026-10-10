import { z } from 'zod';
import { APP_DEFAULTS, ROLES, SUPPORTED_LANGUAGES } from '../constants/app.constants';

export const telegramValidateSchema = z.object({
  initData: z.string().min(1, 'initData majburiy parametr'),
});

export const registerEmailSchema = z.object({
  email: z.string().email('Email manzili noto\'g\'ri formatda'),
  password: z.string().min(APP_DEFAULTS.PASSWORD_MIN_LENGTH, `Parol kamida ${APP_DEFAULTS.PASSWORD_MIN_LENGTH} ta belgidan iborat bo'lishi kerak`),
  role: z.enum([ROLES.SUPPLIER, ROLES.RECEIVER]),
  first_name: z.string().min(1, 'Ism kiritilishi shart'),
  last_name: z.string().min(1, 'Familiya kiritilishi shart'),
  phone_primary: z.string().min(APP_DEFAULTS.PHONE_MIN_LENGTH, 'Asosiy telefon raqami kiritilishi shart'),
  phone_secondary: z.string().optional().nullable(),
  language: z.enum(SUPPORTED_LANGUAGES).default(APP_DEFAULTS.DEFAULT_LANGUAGE),
  company_name: z.string().optional(),
  delivery_fee: z.number().min(0).optional(),
  is_free_delivery: z.boolean().optional(),
});

export const loginEmailSchema = z.object({
  email: z.string().email('Email manzili noto\'g\'ri formatda'),
  password: z.string().min(1, 'Parol kiritilishi shart'),
});

export const googleAuthSchema = z.object({
  google_id: z.string().optional(),
  email: z.string().email('Google email manzili noto\'g\'ri formatda'),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  avatar_url: z.string().optional().nullable(),
  role: z.enum([ROLES.SUPPLIER, ROLES.RECEIVER]).optional(),
  phone_primary: z.string().optional(),
  company_name: z.string().optional(),
  delivery_fee: z.union([z.number(), z.string()]).optional(),
  is_free_delivery: z.boolean().optional(),
});

export const registerTelegramSchema = z.object({
  telegram_id: z.number().int().optional().nullable(),
  role: z.enum([ROLES.SUPPLIER, ROLES.RECEIVER]),
  first_name: z.string().min(1, 'Ism kiritilishi shart'),
  last_name: z.string().min(1, 'Familiya kiritilishi shart'),
  phone_primary: z.string().min(APP_DEFAULTS.PHONE_MIN_LENGTH, 'Asosiy telefon raqami noto\'g\'ri'),
  phone_secondary: z.string().optional().nullable(),
  language: z.enum(SUPPORTED_LANGUAGES).default(APP_DEFAULTS.DEFAULT_LANGUAGE),
  company_name: z.string().optional(),
  delivery_fee: z.number().min(0).optional(),
  is_free_delivery: z.boolean().optional(),
});

export const updateProfileSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone_primary: z.string().min(APP_DEFAULTS.PHONE_MIN_LENGTH).optional(),
  phone_secondary: z.string().nullable().optional(),
  language: z.enum(SUPPORTED_LANGUAGES).optional(),
});

export const devLoginSchema = z.object({
  role: z.enum([ROLES.SUPPLIER, ROLES.RECEIVER]).optional(),
});

export type RegisterEmailInput = z.infer<typeof registerEmailSchema>;
export type LoginEmailInput = z.infer<typeof loginEmailSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type RegisterTelegramInput = z.infer<typeof registerTelegramSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
