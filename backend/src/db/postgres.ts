import { Pool } from 'pg';
import { config } from '../config';
import { User, Supplier, Product, Order, OrderItem, Delivery } from '../types';

export const pgPool = new Pool({
  connectionString: config.databaseUrl,
});

export async function initPostgresTables() {
  if (!config.databaseUrl) return false;
  try {
    const client = await pgPool.connect();
    console.log('🐘 [PostgreSQL] Successfully connected to database');

    // Create required tables if they do not exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        telegram_id BIGINT UNIQUE,
        email VARCHAR(255) UNIQUE,
        password_hash TEXT,
        google_id VARCHAR(255) UNIQUE,
        avatar_url TEXT,
        role VARCHAR(50) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        phone_primary VARCHAR(50) NOT NULL,
        phone_secondary VARCHAR(50),
        plain_password TEXT,
        language VARCHAR(10) DEFAULT 'uz',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS plain_password TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);

      CREATE TABLE IF NOT EXISTS suppliers (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(255) NOT NULL,
        delivery_fee NUMERIC(12, 2) DEFAULT 0.0,
        is_free_delivery BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(255) PRIMARY KEY,
        supplier_id VARCHAR(255) NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(12, 2) NOT NULL,
        discount_price NUMERIC(12, 2),
        is_available BOOLEAN DEFAULT TRUE,
        quantity_optional INT,
        image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) PRIMARY KEY,
        receiver_id VARCHAR(255) NOT NULL REFERENCES users(id),
        supplier_id VARCHAR(255) NOT NULL REFERENCES suppliers(id),
        status VARCHAR(50) DEFAULT 'PENDING',
        delivery_lat DOUBLE PRECISION NOT NULL,
        delivery_lng DOUBLE PRECISION NOT NULL,
        delivery_address TEXT NOT NULL,
        delivery_time_slot VARCHAR(100) NOT NULL,
        notes TEXT,
        total_price NUMERIC(12, 2) NOT NULL,
        rejection_reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id VARCHAR(255) PRIMARY KEY,
        order_id VARCHAR(255) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id VARCHAR(255) NOT NULL REFERENCES products(id),
        quantity INT DEFAULT 1,
        price_at_order NUMERIC(12, 2) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS deliveries (
        id VARCHAR(255) PRIMARY KEY,
        order_id VARCHAR(255) UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        vehicle_model VARCHAR(255) NOT NULL,
        vehicle_plate_number VARCHAR(100) NOT NULL,
        driver_name VARCHAR(255) NOT NULL,
        driver_phone VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    console.log('🐘 [PostgreSQL] Database tables verified & initialized successfully!');
    client.release();
    return true;
  } catch (err) {
    console.warn('⚠️ [PostgreSQL] Connection warning (using persistent engine):', (err as any).message);
    return false;
  }
}

export async function loadAllFromPostgres() {
  if (!config.databaseUrl) return null;
  try {
    const [u, s, p, o, oi, d] = await Promise.all([
      pgPool.query('SELECT * FROM users'),
      pgPool.query('SELECT * FROM suppliers'),
      pgPool.query('SELECT * FROM products'),
      pgPool.query('SELECT * FROM orders'),
      pgPool.query('SELECT * FROM order_items'),
      pgPool.query('SELECT * FROM deliveries'),
    ]);
    return {
      users: u.rows.map((row: any) => ({
        ...row,
        telegram_id: row.telegram_id ? Number(row.telegram_id) : null,
        plain_password: row.plain_password || null,
        created_at: new Date(row.created_at).toISOString(),
        updated_at: new Date(row.updated_at).toISOString(),
      })),
      suppliers: s.rows.map((row: any) => ({
        ...row,
        delivery_fee: Number(row.delivery_fee),
        is_free_delivery: Boolean(row.is_free_delivery),
        created_at: new Date(row.created_at).toISOString(),
        updated_at: new Date(row.updated_at).toISOString(),
      })),
      products: p.rows.map((row: any) => ({
        ...row,
        price: Number(row.price),
        discount_price: row.discount_price !== null ? Number(row.discount_price) : null,
        is_available: Boolean(row.is_available),
        created_at: new Date(row.created_at).toISOString(),
        updated_at: new Date(row.updated_at).toISOString(),
      })),
      orders: o.rows.map((row: any) => ({
        ...row,
        total_price: Number(row.total_price),
        delivery_lat: Number(row.delivery_lat),
        delivery_lng: Number(row.delivery_lng),
        created_at: new Date(row.created_at).toISOString(),
        updated_at: new Date(row.updated_at).toISOString(),
      })),
      orderItems: oi.rows.map((row: any) => ({
        ...row,
        quantity: Number(row.quantity),
        price_at_order: Number(row.price_at_order),
      })),
      deliveries: d.rows.map((row: any) => ({
        ...row,
        created_at: new Date(row.created_at).toISOString(),
        updated_at: new Date(row.updated_at).toISOString(),
      })),
    };
  } catch (err: any) {
    console.error('[PostgreSQL] loadAllFromPostgres error:', err.message);
    return null;
  }
}

export async function truncateAllPostgresTables() {
  if (!config.databaseUrl) return;
  try {
    await pgPool.query(
      `TRUNCATE TABLE deliveries, order_items, orders, products, suppliers, users CASCADE;`
    );
    console.log('🐘 [PostgreSQL] All tables truncated and cleaned!');
  } catch (err) {
    console.error('[PostgreSQL] Truncate error:', (err as any).message);
  }
}

/**
 * Synchronize users to PostgreSQL
 */
export async function deleteUserFromPostgres(userId: string) {
  if (!config.databaseUrl) return;
  try {
    // Delete any orders where user is receiver
    await pgPool.query('DELETE FROM orders WHERE receiver_id = $1', [userId]);

    // Check if user has a supplier and clean up
    const supRes = await pgPool.query('SELECT id FROM suppliers WHERE user_id = $1', [userId]);
    for (const sup of supRes.rows) {
      await pgPool.query('DELETE FROM orders WHERE supplier_id = $1', [sup.id]);
      await pgPool.query('DELETE FROM products WHERE supplier_id = $1', [sup.id]);
      await pgPool.query('DELETE FROM suppliers WHERE id = $1', [sup.id]);
    }

    await pgPool.query('DELETE FROM users WHERE id = $1', [userId]);
    console.log(`🗑️ [PostgreSQL] User and related data deleted from database: ${userId}`);
  } catch (err: any) {
    console.error('[PostgreSQL] deleteUser error:', err.message);
  }
}

/**
 * Synchronize users to PostgreSQL
 */
export async function syncUserToPostgres(user: User) {
  if (!config.databaseUrl) return;
  try {
    await pgPool.query(
      `INSERT INTO users (id, telegram_id, email, password_hash, google_id, avatar_url, role, first_name, last_name, phone_primary, phone_secondary, plain_password, company_name, language, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (id) DO UPDATE SET
         telegram_id = EXCLUDED.telegram_id,
         email = EXCLUDED.email,
         password_hash = EXCLUDED.password_hash,
         google_id = EXCLUDED.google_id,
         avatar_url = EXCLUDED.avatar_url,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         phone_primary = EXCLUDED.phone_primary,
         phone_secondary = EXCLUDED.phone_secondary,
         plain_password = EXCLUDED.plain_password,
         company_name = EXCLUDED.company_name,
         language = EXCLUDED.language,
         updated_at = EXCLUDED.updated_at;`,
      [
        user.id,
        user.telegram_id ?? null,
        user.email || null,
        user.password_hash || null,
        user.google_id || null,
        user.avatar_url || null,
        user.role,
        user.first_name,
        user.last_name,
        user.phone_primary,
        user.phone_secondary || null,
        user.plain_password || null,
        user.company_name || null,
        user.language,
        user.created_at,
        user.updated_at,
      ]
    );
  } catch (err) {
    console.error('[PostgreSQL] syncUser error:', (err as any).message);
  }
}

/**
 * Synchronize suppliers to PostgreSQL
 */
export async function syncSupplierToPostgres(supplier: Supplier) {
  if (!config.databaseUrl) return;
  try {
    await pgPool.query(
      `INSERT INTO suppliers (id, user_id, company_name, delivery_fee, is_free_delivery, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         company_name = EXCLUDED.company_name,
         delivery_fee = EXCLUDED.delivery_fee,
         is_free_delivery = EXCLUDED.is_free_delivery,
         updated_at = EXCLUDED.updated_at;`,
      [
        supplier.id,
        supplier.user_id,
        supplier.company_name,
        supplier.delivery_fee,
        supplier.is_free_delivery,
        supplier.created_at,
        supplier.updated_at,
      ]
    );
  } catch (err) {
    console.error('[PostgreSQL] syncSupplier error:', (err as any).message);
  }
}

/**
 * Synchronize products to PostgreSQL
 */
export async function syncProductToPostgres(product: Product) {
  if (!config.databaseUrl) return;
  try {
    await pgPool.query(
      `INSERT INTO products (id, supplier_id, name, description, price, discount_price, is_available, quantity_optional, image_url, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         price = EXCLUDED.price,
         discount_price = EXCLUDED.discount_price,
         is_available = EXCLUDED.is_available,
         quantity_optional = EXCLUDED.quantity_optional,
         image_url = EXCLUDED.image_url,
         updated_at = EXCLUDED.updated_at;`,
      [
        product.id,
        product.supplier_id,
        product.name,
        product.description || null,
        product.price,
        product.discount_price ?? null,
        product.is_available,
        product.quantity_optional ?? null,
        product.image_url || null,
        product.created_at,
        product.updated_at,
      ]
    );
  } catch (err) {
    console.error('[PostgreSQL] syncProduct error:', (err as any).message);
  }
}

/**
 * Delete product from PostgreSQL
 */
export async function deleteProductFromPostgres(productId: string) {
  if (!config.databaseUrl) return;
  try {
    await pgPool.query(`DELETE FROM products WHERE id = $1`, [productId]);
  } catch (err) {
    console.error('[PostgreSQL] deleteProduct error:', (err as any).message);
  }
}

/**
 * Synchronize order and order_items to PostgreSQL
 */
export async function syncOrderToPostgres(order: Order, items: OrderItem[] = []) {
  if (!config.databaseUrl) return;
  try {
    await pgPool.query(
      `INSERT INTO orders (id, receiver_id, supplier_id, status, delivery_lat, delivery_lng, delivery_address, delivery_time_slot, notes, total_price, rejection_reason, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         rejection_reason = EXCLUDED.rejection_reason,
         updated_at = EXCLUDED.updated_at;`,
      [
        order.id,
        order.receiver_id,
        order.supplier_id,
        order.status,
        order.delivery_lat,
        order.delivery_lng,
        order.delivery_address,
        order.delivery_time_slot,
        order.notes || null,
        order.total_price,
        order.rejection_reason || null,
        order.created_at,
        order.updated_at,
      ]
    );

    for (const item of items) {
      await pgPool.query(
        `INSERT INTO order_items (id, order_id, product_id, quantity, price_at_order)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING;`,
        [item.id, item.order_id, item.product_id, item.quantity, item.price_at_order]
      );
    }
  } catch (err) {
    console.error('[PostgreSQL] syncOrder error:', (err as any).message);
  }
}

/**
 * Synchronize delivery to PostgreSQL
 */
export async function syncDeliveryToPostgres(delivery: Delivery) {
  if (!config.databaseUrl) return;
  try {
    await pgPool.query(
      `INSERT INTO deliveries (id, order_id, vehicle_model, vehicle_plate_number, driver_name, driver_phone, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         vehicle_model = EXCLUDED.vehicle_model,
         vehicle_plate_number = EXCLUDED.vehicle_plate_number,
         driver_name = EXCLUDED.driver_name,
         driver_phone = EXCLUDED.driver_phone,
         updated_at = EXCLUDED.updated_at;`,
      [
        delivery.id,
        delivery.order_id,
        delivery.vehicle_model,
        delivery.vehicle_plate_number,
        delivery.driver_name,
        delivery.driver_phone,
        delivery.created_at,
        delivery.updated_at,
      ]
    );
  } catch (err) {
    console.error('[PostgreSQL] syncDelivery error:', (err as any).message);
  }
}
