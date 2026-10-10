import { Pool } from 'pg';
import { config } from '../config';
import { User, Supplier, Product, Order, OrderItem, Delivery } from '../types';

export const pgPool = new Pool({
  connectionString: config.databaseUrl,
});

export async function initPostgresTables() {
  try {
    const client = await pgPool.connect();
    console.log('🐘 [PostgreSQL] Successfully connected to database: bude_delivery');
    client.release();
    return true;
  } catch (err) {
    console.warn('⚠️ [PostgreSQL] Connection warning (using persistent engine):', (err as any).message);
    return false;
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
export async function syncUserToPostgres(user: User) {
  if (!config.databaseUrl) return;
  try {
    await pgPool.query(
      `INSERT INTO users (id, telegram_id, email, password_hash, google_id, avatar_url, role, first_name, last_name, phone_primary, phone_secondary, language, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
