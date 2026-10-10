import { OrderStatus, Role } from '../types';

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

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['PREPARING', 'REJECTED'],
  PREPARING: ['IN_TRANSIT', 'REJECTED'],
  IN_TRANSIT: ['DELIVERED', 'REJECTED'],
  DELIVERED: [],
  REJECTED: [],
};

export const SUPPORTED_LANGUAGES = ['uz', 'ru', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const APP_DEFAULTS = {
  DELIVERY_FEE: 15000,
  JWT_EXPIRES_IN: '30d',
  BCRYPT_SALT_ROUNDS: 10,
  PASSWORD_MIN_LENGTH: 6,
  PHONE_MIN_LENGTH: 7,
  PORT: 5000,
  DEFAULT_LANGUAGE: 'uz' as SupportedLanguage,
} as const;

export const SOCKET_ROOMS = {
  user: (userId: string) => `user:${userId}`,
  supplier: (supplierId: string) => `supplier:${supplierId}`,
  receiver: (receiverId: string) => `receiver:${receiverId}`,
  order: (orderId: string) => `order:${orderId}`,
} as const;

export const SOCKET_EVENTS = {
  ORDER_NEW: 'order:new',
  ORDER_STATUS_UPDATED: 'order:status_updated',
  PRODUCT_UPDATED: 'product:updated',
  JOIN_SUPPLIER: 'join:supplier',
  JOIN_RECEIVER: 'join:receiver',
  JOIN_ORDER: 'join:order',
  LEAVE_ORDER: 'leave:order',
} as const;
