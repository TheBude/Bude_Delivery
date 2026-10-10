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
        () => {
          const search = new URLSearchParams();
          if (params?.q) search.set('q', params.q);
          if (params?.free_delivery) search.set('free_delivery', 'true');
          const qs = search.toString();
          return request<Supplier[]>(`/suppliers${qs ? `?${qs}` : ''}`);
        }
      ),

    getById: (id: string): Promise<Supplier & { user?: User; products?: Product[] }> =>
      dispatch(
        () => demoStore.getSupplierById(id) as unknown as Supplier & { user?: User; products?: Product[] },
        () => request<Supplier & { user?: User; products?: Product[] }>(`/suppliers/${id}`)
      ),

    updateSettings: (settings: {
      company_name?: string;
      delivery_fee?: number;
      is_free_delivery?: boolean;
    }): Promise<{ message: string; supplier: Supplier }> =>
      dispatch(
        () => demoStore.updateSupplierSettings(settings) as unknown as { message: string; supplier: Supplier },
        () =>
          request<{ message: string; supplier: Supplier }>('/suppliers/settings', {
            method: 'PUT',
            body: JSON.stringify(settings),
          })
      ),
  },

  products: {
    getBySupplier: (supplierId: string, all = false): Promise<Product[]> =>
      dispatch(
        () => demoStore.getProductsBySupplier(supplierId, all) as unknown as Product[],
        () => request<Product[]>(`/products/supplier/${supplierId}${all ? '?all=true' : ''}`)
      ),

    create: (product: Partial<Product>): Promise<{ message: string; product: Product }> =>
      dispatch(
        () => demoStore.createProduct(product) as unknown as { message: string; product: Product },
        () =>
          request<{ message: string; product: Product }>('/products', {
            method: 'POST',
            body: JSON.stringify(product),
          })
      ),

    update: (id: string, product: Partial<Product>): Promise<{ message: string; product: Product }> =>
      dispatch(
        () => demoStore.updateProduct(id, product) as unknown as { message: string; product: Product },
        () =>
          request<{ message: string; product: Product }>(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(product),
          })
      ),

    toggleAvailability: (
      id: string,
      is_available?: boolean
    ): Promise<{ message: string; product: Product }> =>
      dispatch(
        () => demoStore.toggleProductAvailability(id, is_available) as unknown as { message: string; product: Product },
        () =>
          request<{ message: string; product: Product }>(`/products/${id}/availability`, {
            method: 'PATCH',
            body: JSON.stringify({ is_available }),
          })
      ),

    delete: (id: string): Promise<{ message: string }> =>
      dispatch(
        () => demoStore.deleteProduct(id) as unknown as { message: string },
        () =>
          request<{ message: string }>(`/products/${id}`, {
            method: 'DELETE',
          })
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
      request(`/admin/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
  },
};
