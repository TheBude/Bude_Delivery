export type Role = 'SUPPLIER' | 'RECEIVER' | 'ADMIN';

export type OrderStatus =
  | 'PENDING'
  | 'PREPARING'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'REJECTED';

export interface User {
  id: string;
  telegram_id?: number | null;
  email?: string | null;
  avatar_url?: string | null;
  role: Role;
  first_name: string;
  last_name: string;
  phone_primary: string;
  phone_secondary?: string | null;
  language: string;
  created_at?: string;
  updated_at?: string;
}

export interface Supplier {
  id: string;
  user_id: string;
  company_name: string;
  delivery_fee: number;
  is_free_delivery: boolean;
  created_at?: string;
  updated_at?: string;
  user?: User;
  active_products_count?: number;
}

export interface Product {
  id: string;
  supplier_id: string;
  name: string;
  description?: string | null;
  price: number;
  discount_price?: number | null;
  is_available: boolean;
  quantity_optional?: number | null;
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_order: number;
  product?: Product;
}

export interface Delivery {
  id: string;
  order_id: string;
  vehicle_model: string;
  vehicle_plate_number: string;
  driver_name: string;
  driver_phone: string;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  receiver_id: string;
  supplier_id: string;
  status: OrderStatus;
  delivery_lat: number;
  delivery_lng: number;
  delivery_address: string;
  delivery_time_slot: string;
  notes?: string | null;
  total_price: number;
  rejection_reason?: string | null;
  created_at: string;
  updated_at?: string;
  items?: OrderItem[];
  delivery?: Delivery | null;
  receiver?: User;
  supplier?: Supplier;
}

export interface CourierInfo {
  vehicle_model: string;
  vehicle_plate_number: string;
  driver_name: string;
  driver_phone: string;
}

export interface AuthSuccessResponse {
  isNewUser?: boolean;
  user: User;
  supplier?: Supplier | null;
  token: string;
  message?: string;
  telegramUser?: {
    id: number;
    first_name: string;
    last_name?: string;
  };
  googleUser?: {
    google_id: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar_url?: string | null;
  };
}

export interface AuthCheckResponse {
  isNewUser?: boolean;
  user?: User;
  supplier?: Supplier | null;
  token?: string;
  message?: string;
  telegramUser?: {
    id: number;
    first_name: string;
    last_name?: string;
  };
  googleUser?: {
    google_id: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar_url?: string | null;
  };
}

export interface CreateOrderPayload {
  supplier_id: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  delivery_lat: number;
  delivery_lng: number;
  delivery_address: string;
  delivery_time_slot: string;
  notes?: string | null;
}
