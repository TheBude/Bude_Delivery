-- ====================================================================
-- BUDE DELIVERY - PostgreSQL Database Schema
-- Production-grade schema with optimized indexes, constraints, and triggers
-- ====================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Custom Enum Types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('SUPPLIER', 'RECEIVER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'PENDING',      -- Kutilmoqda (new order placed)
        'PREPARING',    -- Tasdiqlandi / Yuk yig'ilmoqda (supplier accepted)
        'IN_TRANSIT',   -- Yo'lga chiqdi (courier on the way)
        'DELIVERED',    -- Yetkazildi (completed)
        'REJECTED'      -- Bekor qilindi / Rad etildi (rejected with reason)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Users Table
-- Supports Telegram Mini App authentication, roles, contact numbers, and preferred language
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    telegram_id BIGINT UNIQUE,
    email VARCHAR(150) UNIQUE,
    password_hash VARCHAR(255),
    google_id VARCHAR(100) UNIQUE,
    avatar_url TEXT,
    role user_role NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_primary VARCHAR(25) NOT NULL,
    phone_secondary VARCHAR(25),
    language VARCHAR(5) DEFAULT 'uz' NOT NULL, -- uz, ru, en
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for Users
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_phone_primary ON users(phone_primary);

-- 3. Suppliers Table
-- Profile and delivery configuration for suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(150) NOT NULL,
    delivery_fee NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    is_free_delivery BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for Suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_company_name ON suppliers(company_name);

-- 4. Products Table
-- Supplier catalog with price, promo discount, availability switcher and optional quantity
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(64) PRIMARY KEY,
    supplier_id VARCHAR(64) NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    discount_price NUMERIC(12, 2) CHECK (discount_price IS NULL OR discount_price >= 0),
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    quantity_optional INTEGER CHECK (quantity_optional IS NULL OR quantity_optional >= 0),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for Products
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- 5. Orders Table
-- Complete lifecycle of orders with geolocation, time slots, and totals
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) PRIMARY KEY,
    receiver_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    supplier_id VARCHAR(64) NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    status order_status DEFAULT 'PENDING' NOT NULL,
    delivery_lat DOUBLE PRECISION NOT NULL,
    delivery_lng DOUBLE PRECISION NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_time_slot VARCHAR(50) NOT NULL, -- e.g. "14:00 - 16:00"
    notes TEXT,
    total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for Orders
CREATE INDEX IF NOT EXISTS idx_orders_receiver_id ON orders(receiver_id);
CREATE INDEX IF NOT EXISTS idx_orders_supplier_id ON orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_supplier_status ON orders(supplier_id, status);

-- 6. OrderItems Table
-- Items snapshots per order with quantity and locked price at purchase time
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0),
    price_at_order NUMERIC(12, 2) NOT NULL CHECK (price_at_order >= 0)
);

-- Indexes for OrderItems
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- 7. Deliveries Table
-- Courier and vehicle info assigned upon order acceptance
CREATE TABLE IF NOT EXISTS deliveries (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    vehicle_model VARCHAR(100) NOT NULL,
    vehicle_plate_number VARCHAR(30) NOT NULL,
    driver_name VARCHAR(100) NOT NULL,
    driver_phone VARCHAR(25) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for Deliveries
CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver_phone ON deliveries(driver_phone);

-- Comments on tables for database documentation
COMMENT ON TABLE users IS 'Registered users: Suppliers or Receivers with Telegram credentials';
COMMENT ON TABLE suppliers IS 'Supplier profiles with logistics configurations';
COMMENT ON TABLE products IS 'Supplier goods and inventory availability';
COMMENT ON TABLE orders IS 'Customer orders with status timeline and delivery coordinates';
COMMENT ON TABLE order_items IS 'Line items for each placed order';
COMMENT ON TABLE deliveries IS 'Vehicle and courier assignment for accepted orders';
