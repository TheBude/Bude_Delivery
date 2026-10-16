import { demoStore } from './demoStore';
import { APP_CONFIG, STORAGE_KEYS } from '../constants';
import type {
  AuthCheckResponse,
  AuthSuccessResponse,
  CourierInfo,
  CreateOrderPayload,
  Order,
  Product,
  Supplier,
  User,
  Role,
} from '../types';

export const getToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
};

export const setToken = (token: string): void => {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
};

export const isDemoSession = (): boolean => {
  const token = getToken();
  return Boolean(token && token.startsWith('demo_'));
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${APP_CONFIG.API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Serverda xatolik yuz berdi');
  }

  return data as T;
}

/**
 * Client-Side In-Memory Response Cache with TTL (Time-To-Live)
 * Provides 0ms instant loading when revisiting catalogs/suppliers on mobile
 */
const apiCache = new Map<string, { data: any; expiry: number }>();

export function getCachedData<T>(key: string): T | null {
  const entry = apiCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    apiCache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCachedData<T>(key: string, data: T, ttlMs = 25000): void {
  apiCache.set(key, { data, expiry: Date.now() + ttlMs });
}

export function clearApiCache(prefix?: string): void {
  if (!prefix) {
    apiCache.clear();
    return;
  }
  for (const k of Array.from(apiCache.keys())) {
    if (k.startsWith(prefix)) {
      apiCache.delete(k);
    }
  }
}

/**
 * Dispatch helper: Executes demoStore logic if demo session is active,
 * otherwise performs real HTTP request.
 */
function dispatch<T>(demoFn: () => T | Promise<T>, httpFn: () => Promise<T>): Promise<T> {
  if (isDemoSession()) {
    return Promise.resolve(demoFn());
  }
  return httpFn();
}

export const api = {
  auth: {
    demoLogin: (role: 'SUPPLIER' | 'RECEIVER'): Promise<AuthSuccessResponse> => {
      const res = demoStore.loginRole(role);
      setToken(res.token);
      return Promise.resolve(res as unknown as AuthSuccessResponse);
    },

    resetDemo: (): Promise<void> => {
      demoStore.resetToDefault();
      return Promise.resolve();
    },

    validateTelegram: (initData: string): Promise<AuthCheckResponse> =>
      dispatch(
        () => demoStore.getMe() as unknown as AuthCheckResponse,
        () =>
          request<AuthCheckResponse>('/auth/telegram-validate', {
            method: 'POST',
            body: JSON.stringify({ initData }),
          })
      ),

    register: (userData: any): Promise<AuthSuccessResponse> =>
      request<AuthSuccessResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),

    registerEmail: (data: any): Promise<AuthSuccessResponse> =>
      request<AuthSuccessResponse>('/auth/register-email', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    loginEmail: (data: { email: string; password: string }): Promise<AuthSuccessResponse> =>
      request<AuthSuccessResponse>('/auth/login-email', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    googleAuth: (data: any): Promise<AuthCheckResponse> =>
      request<AuthCheckResponse>('/auth/google', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    devLogin: (role: 'SUPPLIER' | 'RECEIVER'): Promise<AuthSuccessResponse> => {
      return api.auth.demoLogin(role);
    },

    getMe: (): Promise<{ user: User; supplier?: Supplier }> =>
      dispatch(
        () => demoStore.getMe() as unknown as { user: User; supplier?: Supplier },
        () => request<{ user: User; supplier?: Supplier }>('/auth/me')
      ),

    updateProfile: (profile: Partial<User>): Promise<{ message: string; user: User }> =>
      dispatch(
        () => demoStore.updateProfile(profile as any) as unknown as { message: string; user: User },
        () =>
          request<{ message: string; user: User }>('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(profile),
          })
      ),
  },

  suppliers: {
    getAll: (params?: { q?: string; free_delivery?: boolean }): Promise<Supplier[]> =>
      dispatch(
        () => demoStore.getSuppliers(params) as unknown as Supplier[],
        async () => {
          const search = new URLSearchParams();
          if (params?.q) search.set('q', params.q);
          if (params?.free_delivery) search.set('free_delivery', 'true');
          const qs = search.toString();
          const cacheKey = `suppliers:all:${qs}`;
          const cached = getCachedData<Supplier[]>(cacheKey);
          if (cached) return cached;
          const result = await request<Supplier[]>(`/suppliers${qs ? `?${qs}` : ''}`);
          setCachedData(cacheKey, result, 25000);
          return result;
        }
      ),

    getById: (id: string): Promise<Supplier & { user?: User; products?: Product[] }> =>
      dispatch(
        () => demoStore.getSupplierById(id) as unknown as Supplier & { user?: User; products?: Product[] },
        async () => {
          const cacheKey = `suppliers:${id}`;
          const cached = getCachedData<Supplier & { user?: User; products?: Product[] }>(cacheKey);
          if (cached) return cached;
          const result = await request<Supplier & { user?: User; products?: Product[] }>(`/suppliers/${id}`);
          setCachedData(cacheKey, result, 25000);
          return result;
        }
      ),

    updateSettings: (settings: {
      company_name?: string;
      delivery_fee?: number;
      is_free_delivery?: boolean;
    }): Promise<{ message: string; supplier: Supplier }> =>
      dispatch(
        () => demoStore.updateSupplierSettings(settings) as unknown as { message: string; supplier: Supplier },
        async () => {
          const res = await request<{ message: string; supplier: Supplier }>('/suppliers/settings', {
            method: 'PUT',
            body: JSON.stringify(settings),
          });
          clearApiCache('suppliers');
          return res;
        }
      ),
  },

  products: {
    getBySupplier: (supplierId: string, all = false): Promise<Product[]> =>
      dispatch(
        () => demoStore.getProductsBySupplier(supplierId, all) as unknown as Product[],
        async () => {
          const cacheKey = `products:${supplierId}:${all}`;
          const cached = getCachedData<Product[]>(cacheKey);
          if (cached) return cached;
          const result = await request<Product[]>(`/products/supplier/${supplierId}${all ? '?all=true' : ''}`);
          setCachedData(cacheKey, result, 25000);
          return result;
        }
      ),

    create: (product: Partial<Product>): Promise<{ message: string; product: Product }> =>
      dispatch(
        () => demoStore.createProduct(product) as unknown as { message: string; product: Product },
        async () => {
          const res = await request<{ message: string; product: Product }>('/products', {
            method: 'POST',
            body: JSON.stringify(product),
          });
          clearApiCache('products');
          return res;
        }
      ),

    update: (id: string, product: Partial<Product>): Promise<{ message: string; product: Product }> =>
      dispatch(
        () => demoStore.updateProduct(id, product) as unknown as { message: string; product: Product },
        async () => {
          const res = await request<{ message: string; product: Product }>(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(product),
          });
          clearApiCache('products');
          return res;
        }
      ),

    toggleAvailability: (
      id: string,
      is_available?: boolean
    ): Promise<{ message: string; product: Product }> =>
      dispatch(
        () => demoStore.toggleProductAvailability(id, is_available) as unknown as { message: string; product: Product },
        async () => {
          const res = await request<{ message: string; product: Product }>(`/products/${id}/availability`, {
            method: 'PATCH',
            body: JSON.stringify({ is_available }),
          });
          clearApiCache('products');
          return res;
        }
      ),

    delete: (id: string): Promise<{ message: string }> =>
      dispatch(
        () => demoStore.deleteProduct(id) as unknown as { message: string },
        async () => {
          const res = await request<{ message: string }>(`/products/${id}`, {
            method: 'DELETE',
          });
          clearApiCache('products');
          return res;
        }
      ),
  },

  orders: {
    create: (orderData: CreateOrderPayload): Promise<{ message: string; order: Order }> =>
      dispatch(
        () => demoStore.createOrder(orderData) as unknown as { message: string; order: Order },
        () =>
          request<{ message: string; order: Order }>('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData),
          })
      ),

    getReceiverOrders: (): Promise<Order[]> =>
      dispatch(
        () => demoStore.getReceiverOrders() as unknown as Order[],
        () => request<Order[]>('/orders/receiver')
      ),

    getSupplierOrders: (): Promise<Order[]> =>
      dispatch(
        () => demoStore.getSupplierOrders() as unknown as Order[],
        () => request<Order[]>('/orders/supplier')
      ),

    getById: (id: string): Promise<Order> =>
      dispatch(
        () => demoStore.getOrderById(id) as unknown as Order,
        () => request<Order>(`/orders/${id}`)
      ),

    accept: (id: string, courier: CourierInfo): Promise<{ message: string; order: Order }> =>
      dispatch(
        () => demoStore.acceptOrder(id, courier) as unknown as { message: string; order: Order },
        () =>
          request<{ message: string; order: Order }>(`/orders/${id}/accept`, {
            method: 'POST',
            body: JSON.stringify(courier),
          })
      ),

    updateStatus: (id: string, status: string): Promise<{ message: string; order: Order }> =>
      dispatch(
        () => demoStore.updateOrderStatus(id, status) as unknown as { message: string; order: Order },
        () =>
          request<{ message: string; order: Order }>(`/orders/${id}/status`, {
            method: 'POST',
            body: JSON.stringify({ status }),
          })
      ),

    reject: (id: string, rejection_reason: string): Promise<{ message: string; order: Order }> =>
      dispatch(
        () => demoStore.rejectOrder(id, rejection_reason) as unknown as { message: string; order: Order },
        () =>
          request<{ message: string; order: Order }>(`/orders/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ rejection_reason }),
          })
      ),

    cancel: (id: string, reason?: string): Promise<{ message: string; order: Order }> =>
      dispatch(
        () => demoStore.cancelOrder(id, reason) as unknown as { message: string; order: Order },
        () =>
          request<{ message: string; order: Order }>(`/orders/${id}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ cancellation_reason: reason }),
          })
      ),
  },

  admin: {
    getOverview: (): Promise<{
      stats: {
        totalUsers: number;
        receiversCount: number;
        suppliersCount: number;
        totalOrders: number;
        totalRevenue: number;
      };
      users: User[];
      suppliers: Supplier[];
      orders: Order[];
    }> =>
      dispatch(
        () => demoStore.getAdminOverview() as any,
        () => request('/admin/overview')
      ),

    updateUserRole: (id: string, role: Role): Promise<{ message: string; user: User }> =>
      dispatch(
        () => demoStore.updateUserRole(id, role) as any,
        () =>
          request(`/admin/users/${id}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role }),
          })
      ),

    deleteUser: (id: string): Promise<{ message: string; deletedUserId: string }> =>
      dispatch(
        () => demoStore.deleteUser(id) as any,
        () =>
          request(`/admin/users/${id}`, {
            method: 'DELETE',
          })
      ),

    resetUserPassword: (id: string, newPassword: string): Promise<{ message: string; user: User }> =>
      dispatch(
        () => demoStore.resetUserPassword(id, newPassword) as any,
        () =>
          request(`/admin/users/${id}/reset-password`, {
            method: 'POST',
            body: JSON.stringify({ newPassword }),
          })
      ),
  },
};
