const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export const getToken = (): string | null => {
  return localStorage.getItem('bude_token');
};

export const setToken = (token: string) => {
  localStorage.setItem('bude_token', token);
};

export const removeToken = () => {
  localStorage.removeItem('bude_token');
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

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Serverda xatolik yuz berdi');
  }

  return data as T;
}

export const api = {
  auth: {
    validateTelegram: (initData: string) =>
      request<any>('/auth/telegram-validate', {
        method: 'POST',
        body: JSON.stringify({ initData }),
      }),
    register: (userData: any) =>
      request<any>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    registerEmail: (data: any) =>
      request<any>('/auth/register-email', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    loginEmail: (data: { email: string; password: string }) =>
      request<any>('/auth/login-email', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    googleAuth: (data: any) =>
      request<any>('/auth/google', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    devLogin: (role: 'SUPPLIER' | 'RECEIVER') =>
      request<any>('/auth/dev-login', {
        method: 'POST',
        body: JSON.stringify({ role }),
      }),
    getMe: () => request<any>('/auth/me'),
    updateProfile: (profile: any) =>
      request<any>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profile),
      }),
  },
  suppliers: {
    getAll: (params?: { q?: string; free_delivery?: boolean }) => {
      const search = new URLSearchParams();
      if (params?.q) search.set('q', params.q);
      if (params?.free_delivery) search.set('free_delivery', 'true');
      const qs = search.toString();
      return request<any[]>(`/suppliers${qs ? `?${qs}` : ''}`);
    },
    getById: (id: string) => request<any>(`/suppliers/${id}`),
    updateSettings: (settings: { company_name?: string; delivery_fee?: number; is_free_delivery?: boolean }) =>
      request<any>('/suppliers/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }),
  },
  products: {
    getBySupplier: (supplierId: string, all = false) =>
      request<any[]>(`/products/supplier/${supplierId}${all ? '?all=true' : ''}`),
    create: (product: any) =>
      request<any>('/products', {
        method: 'POST',
        body: JSON.stringify(product),
      }),
    update: (id: string, product: any) =>
      request<any>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(product),
      }),
    toggleAvailability: (id: string, is_available?: boolean) =>
      request<any>(`/products/${id}/availability`, {
        method: 'PATCH',
        body: JSON.stringify({ is_available }),
      }),
    delete: (id: string) =>
      request<any>(`/products/${id}`, {
        method: 'DELETE',
      }),
  },
  orders: {
    create: (orderData: any) =>
      request<any>('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      }),
    getReceiverOrders: () => request<any[]>('/orders/receiver'),
    getSupplierOrders: () => request<any[]>('/orders/supplier'),
    getById: (id: string) => request<any>(`/orders/${id}`),
    accept: (id: string, courier: { vehicle_model: string; vehicle_plate_number: string; driver_name: string; driver_phone: string }) =>
      request<any>(`/orders/${id}/accept`, {
        method: 'POST',
        body: JSON.stringify(courier),
      }),
    updateStatus: (id: string, status: string) =>
      request<any>(`/orders/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      }),
    reject: (id: string, rejection_reason: string) =>
      request<any>(`/orders/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejection_reason }),
      }),
  },
};
