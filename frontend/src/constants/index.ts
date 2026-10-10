import type { OrderStatus, Role } from '../types';

export const STORAGE_KEYS = {
  TOKEN: 'bude_token',
  LANGUAGE: 'bude_lang',
  THEME: 'bude_theme',
} as const;

export const APP_CONFIG = {
  API_BASE: import.meta.env.VITE_API_BASE || 'http://localhost:5000/api',
  DEFAULT_DELIVERY_FEE: 15000,
  DEFAULT_LANGUAGE: 'uz',
} as const;

export const ROLES = {
  SUPPLIER: 'SUPPLIER',
  RECEIVER: 'RECEIVER',
} as const satisfies Record<string, Role>;

export const ORDER_STATUSES = {
  PENDING: 'PENDING',
  PREPARING: 'PREPARING',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  REJECTED: 'REJECTED',
} as const satisfies Record<string, OrderStatus>;

export const STATUS_STEPS = [
  { key: ORDER_STATUSES.PENDING, label: 'Kutilmoqda' },
  { key: ORDER_STATUSES.PREPARING, label: "Yuk yig'ilmoqda" },
  { key: ORDER_STATUSES.IN_TRANSIT, label: "Yo'lga chiqdi" },
  { key: ORDER_STATUSES.DELIVERED, label: 'Yetkazildi' },
] as const;
