import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, Supplier, Product, Order, OrderItem, Delivery, Role, OrderStatus } from '../types';
import { ORDER_STATUSES } from '../constants/app.constants';
import { 
  initPostgresTables, 
  loadAllFromPostgres,
  syncUserToPostgres, 
  deleteUserFromPostgres,
  syncSupplierToPostgres, 
  syncProductToPostgres, 
  deleteProductFromPostgres, 
  syncOrderToPostgres, 
  syncDeliveryToPostgres,
  truncateAllPostgresTables
} from './postgres';
import bcrypt from 'bcryptjs';

interface DatabaseData {
  users: User[];
  suppliers: Supplier[];
  products: Product[];
  orders: Order[];
  orderItems: OrderItem[];
  deliveries: Delivery[];
}

const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'bude_db.json');

export class DatabaseStore {
  private data: DatabaseData = {
    users: [],
    suppliers: [],
    products: [],
    orders: [],
    orderItems: [],
    deliveries: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        console.log(`[Database] Loaded persistent data: ${this.data.users.length} users, ${this.data.suppliers.length} suppliers, ${this.data.products.length} products, ${this.data.orders.length} orders.`);
      } catch (err) {
        console.error('[Database] Failed to parse db file', err);
      }
    }

    this.persist();

    // Async sync to PostgreSQL if connected
    initPostgresTables().then(async (connected) => {
      if (connected) {
        const pgData = await loadAllFromPostgres();
        if (pgData && (pgData.users.length > 0 || pgData.suppliers.length > 0 || pgData.products.length > 0)) {
          console.log(`🐘 [PostgreSQL] Loaded data from database: ${pgData.users.length} users, ${pgData.suppliers.length} suppliers, ${pgData.products.length} products.`);
          this.data = pgData as DatabaseData;
          this.persist();
        } else {
          this.seedDefaultDataIfEmpty();
          await this.syncAllToPostgres();
        }
      } else {
        this.seedDefaultDataIfEmpty();
      }
    });
  }

  private seedDefaultDataIfEmpty() {
    if (this.data.suppliers.length > 0) return;

    console.log('🌱 [Database] Seeding default suppliers & products for catalogue...');
    const now = new Date().toISOString();

    const supplierUser1: User = {
      id: 'usr_demo_supplier',
      first_name: 'Akmal',
      last_name: 'Rahmatov',
      phone_primary: '+998 90 123 45 67',
      role: 'SUPPLIER',
      language: 'uz',
      created_at: now,
      updated_at: now,
    };

    const supplier1: Supplier = {
      id: 'sup_buxoro_fresh',
      user_id: supplierUser1.id,
      company_name: 'Buxoro Fresh Market & Logistics',
      delivery_fee: 15000,
      is_free_delivery: false,
      created_at: now,
      updated_at: now,
    };

    const supplierUser2: User = {
      id: 'usr_demo_supplier_2',
      first_name: 'Dilshod',
      last_name: 'Karimov',
      phone_primary: '+998 93 987 65 43',
      role: 'SUPPLIER',
      language: 'uz',
      created_at: now,
      updated_at: now,
    };

    const supplier2: Supplier = {
      id: 'sup_agro_mega',
      user_id: supplierUser2.id,
      company_name: "Toshkent Mega Agro Ta'minot",
      delivery_fee: 0,
      is_free_delivery: true,
      created_at: now,
      updated_at: now,
    };

    const products: Product[] = [
      {
        id: 'prod_1',
        supplier_id: supplier1.id,
        name: 'Olma Golden (Vodil saralangan)',
        description: "Eng shirin va suvli Oltiariq olmalari, yangi uzilgan tabiiy mahsulot",
        price: 18000,
        discount_price: 15000,
        is_available: true,
        quantity_optional: 50,
        image_url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&auto=format&fit=crop&q=60',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'prod_2',
        supplier_id: supplier1.id,
        name: 'Pomidor Qizil (Issiqxona)',
        description: "Tabiiy go'shtdor qizil pomidor, a'lo sifat, to'g'ridan-to'g'ri issiqxonadan",
        price: 22000,
        discount_price: null,
        is_available: true,
        quantity_optional: 30,
        image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=60',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'prod_3',
        supplier_id: supplier1.id,
        name: 'Bodring Bodomiy',
        description: "Yangi uzilgan qarsildoq bodomiy bodring, qadoqlangan",
        price: 14000,
        discount_price: 12000,
        is_available: true,
        quantity_optional: 40,
        image_url: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400&auto=format&fit=crop&q=60',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'prod_4',
        supplier_id: supplier1.id,
        name: "Tog' Asali (1 kg, Tabiiy)",
        description: "Chotqol tog'larining 100% tabiiy toza gul asali, shifobaxsh",
        price: 85000,
        discount_price: 79000,
        is_available: true,
        quantity_optional: 20,
        image_url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&auto=format&fit=crop&q=60',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'prod_5',
        supplier_id: supplier2.id,
        name: 'Karam Oqbosh (1 kg)',
        description: "Yangi hosil, qattiq va shira to'la oqbosh karam",
        price: 5000,
        discount_price: null,
        is_available: true,
        quantity_optional: 100,
        image_url: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=400&auto=format&fit=crop&q=60',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'prod_6',
        supplier_id: supplier2.id,
        name: 'Sabzi Qizil (Saralangan)',
        description: "Tozalangan, shirin shirador qizil sabzi",
        price: 6000,
        discount_price: null,
        is_available: true,
        quantity_optional: 80,
        image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&auto=format&fit=crop&q=60',
        created_at: now,
        updated_at: now,
      },
    ];

    if (!this.data.users.find(u => u.id === supplierUser1.id)) this.data.users.push(supplierUser1);
    if (!this.data.users.find(u => u.id === supplierUser2.id)) this.data.users.push(supplierUser2);
    this.data.suppliers.push(supplier1, supplier2);
    this.data.products.push(...products);

    this.persist();
    console.log('✅ [Database] Seeded 2 suppliers and 6 products successfully.');
  }

  public async clearAllData() {
    this.data = {
      users: [],
      suppliers: [],
      products: [],
      orders: [],
      orderItems: [],
      deliveries: [],
    };
    this.persist();
    await truncateAllPostgresTables();
    console.log('🧹 [Database] All data, users, and orders completely cleared!');
  }

  public async syncAllToPostgres() {
    try {
      for (const user of this.data.users) {
        await syncUserToPostgres(user);
      }
      for (const sup of this.data.suppliers) {
        await syncSupplierToPostgres(sup);
      }
      for (const prod of this.data.products) {
        await syncProductToPostgres(prod);
      }
      for (const ord of this.data.orders) {
        const items = this.data.orderItems.filter((i) => i.order_id === ord.id);
        await syncOrderToPostgres(ord, items);
      }
      for (const del of this.data.deliveries) {
        await syncDeliveryToPostgres(del);
      }
      console.log('🐘 [PostgreSQL] Initial sync completed for users, suppliers, products, and orders!');
    } catch (e) {
      console.warn('[PostgreSQL] Initial sync warning:', e);
    }
  }

  private persist() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Database] Persist error:', err);
    }
  }

  private seedDefaultData() {
    const now = new Date().toISOString();

    // 1. Seed Users (Suppliers & Receiver)
    const supplierUser1: User = {
      id: 'usr_sup_1',
      telegram_id: 1001,
      role: 'SUPPLIER',
      first_name: 'Alisher',
      last_name: 'Karimov',
      phone_primary: '+998 90 123 45 67',
      phone_secondary: '+998 99 987 65 43',
      language: 'uz',
      created_at: now,
      updated_at: now,
    };

    const supplierUser2: User = {
      id: 'usr_sup_2',
      telegram_id: 1002,
      role: 'SUPPLIER',
      first_name: 'Sardor',
      last_name: 'Rahimov',
      phone_primary: '+998 93 555 12 34',
      phone_secondary: null,
      language: 'uz',
      created_at: now,
      updated_at: now,
    };

    const receiverUser: User = {
      id: 'usr_rec_1',
      telegram_id: 2001,
      role: 'RECEIVER',
      first_name: 'Bobur',
      last_name: 'Mirzayev',
      phone_primary: '+998 97 777 88 99',
      phone_secondary: '+998 90 000 11 22',
      language: 'uz',
      created_at: now,
      updated_at: now,
    };

    this.data.users = [supplierUser1, supplierUser2, receiverUser];

    // 2. Seed Suppliers
    const supplier1: Supplier = {
      id: 'sup_1',
      user_id: supplierUser1.id,
      company_name: 'Buxoro Fresh Market & Logistics',
      delivery_fee: 15000,
      is_free_delivery: false,
      created_at: now,
      updated_at: now,
    };

    const supplier2: Supplier = {
      id: 'sup_2',
      user_id: supplierUser2.id,
      company_name: 'Toshkent Mega Agro Ta\'minot',
      delivery_fee: 0,
      is_free_delivery: true,
      created_at: now,
      updated_at: now,
    };

    this.data.suppliers = [supplier1, supplier2];

    // 3. Seed Products
    this.data.products = [
      {
        id: 'prod_1',
        supplier_id: supplier1.id,
        name: 'Olma (Qizil Shirin, 1kg)',
        description: 'Buxoroning saralangan qizil shirin olmalari. Yuqori sifat va barra.',
        price: 18000,
        discount_price: 15000,
        is_available: true,
        quantity_optional: 250,
        image_url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&auto=format&fit=crop&q=60',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'prod_2',
        supplier_id: supplier1.id,
        name: 'Pomidor (Yusupov, 1kg)',
        description: 'Iliq issiqxonalarda yetishtirilgan shirali va go\'shtdor pomidor.',
        price: 24000,
        discount_price: 20000,
        is_available: true,
        quantity_optional: 180,
        image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=60',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'prod_3',
        supplier_id: supplier1.id,
        name: 'Bodring (Navro\'z navi, 1kg)',
        description: 'Qirsillama va mayin po\'stli barra bodringlar.',
        price: 14000,
        discount_price: null,
        is_available: true,
        quantity_optional: 120,
        image_url: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400&auto=format&fit=crop&q=60',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'prod_4',
        supplier_id: supplier1.id,
        name: 'Tabiiy Asal (Tog\' asali, 1kg)',
        description: 'Bo\'stonliq tog\'laridan yig\'ilgan toza tabiiy gul asali.',
        price: 95000,
        discount_price: 85000,
        is_available: false,
        quantity_optional: 0,
        image_url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&auto=format&fit=crop&q=60',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'prod_5',
        supplier_id: supplier2.id,
        name: 'Pasterizatsiyalangan Sut 3.2% (1L)',
        description: 'Kunlik yangi qadoqlangan, vitaminlar bilan boyitilgan tabiiy sigir suti.',
        price: 12000,
        discount_price: 10500,
        is_available: true,
        quantity_optional: 500,
        image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=60',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'prod_6',
        supplier_id: supplier2.id,
        name: 'Sariyog\' Halol 82.5% (200g)',
        description: 'Yuqori yog\'likdagi xushbo\'y tabiiy sariyog\'.',
        price: 28000,
        discount_price: null,
        is_available: true,
        quantity_optional: 80,
        image_url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&auto=format&fit=crop&q=60',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'prod_7',
        supplier_id: supplier2.id,
        name: 'Qaymoq Toshkent 40% (250g)',
        description: 'Klassik toshkentcha qaymoq, nonushta uchun eng a\'lo tanlov.',
        price: 22000,
        discount_price: 19000,
        is_available: true,
        quantity_optional: 150,
        image_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&auto=format&fit=crop&q=60',
        created_at: now,
        updated_at: now,
      },
    ];

    // 4. Seed a Sample Completed/Active Order
    const sampleOrder: Order = {
      id: 'ord_demo_101',
      receiver_id: receiverUser.id,
      supplier_id: supplier1.id,
      status: 'IN_TRANSIT',
      delivery_lat: 41.311081,
      delivery_lng: 69.240562,
      delivery_address: 'Toshkent sh., Amir Temur shox ko\'chasi, 45-uy',
      delivery_time_slot: '14:00 - 16:00',
      notes: 'Darvozadan kiring, 2-qavat',
      total_price: 50000,
      rejection_reason: null,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: now,
    };

    this.data.orders = [sampleOrder];

    this.data.orderItems = [
      {
        id: 'item_1',
        order_id: sampleOrder.id,
        product_id: 'prod_1',
        quantity: 1,
        price_at_order: 15000,
      },
      {
        id: 'item_2',
        order_id: sampleOrder.id,
        product_id: 'prod_2',
        quantity: 1,
        price_at_order: 20000,
      },
    ];

    this.data.deliveries = [
      {
        id: 'del_1',
        order_id: sampleOrder.id,
        vehicle_model: 'Labo / Damas Deluxe',
        vehicle_plate_number: '01 A 777 BB',
        driver_name: 'Rustam Qodirov',
        driver_phone: '+998 90 999 88 77',
        created_at: now,
        updated_at: now,
      },
    ];
  }

  // --- Users Operations ---
  findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  findUserByTelegramId(telegramId: number): User | undefined {
    return this.data.users.find((u) => u.telegram_id !== null && u.telegram_id !== undefined && Number(u.telegram_id) === Number(telegramId));
  }

  findUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email && u.email.toLowerCase() === email.toLowerCase());
  }

  findUserByGoogleId(googleId: string): User | undefined {
    return this.data.users.find((u) => u.google_id === googleId);
  }

  createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): User {
    const now = new Date().toISOString();
    const newUser: User = {
      ...userData,
      id: `usr_${crypto.randomUUID()}`,
      created_at: now,
      updated_at: now,
    };
    this.data.users.push(newUser);
    this.persist();
    syncUserToPostgres(newUser);
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.findUserById(id);
    if (!user) return undefined;
    Object.assign(user, updates, { updated_at: new Date().toISOString() });
    this.persist();
    syncUserToPostgres(user);
    return user;
  }

  deleteUser(id: string): boolean {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    this.data.users.splice(idx, 1);

    // Also remove any orders made by this user
    this.data.orders = this.data.orders.filter((o) => o.receiver_id !== id);

    // Also remove any supplier linked to this user and their products/orders
    const sup = this.data.suppliers.find((s) => s.user_id === id);
    if (sup) {
      this.data.products = this.data.products.filter((p) => p.supplier_id !== sup.id);
      this.data.orders = this.data.orders.filter((o) => o.supplier_id !== sup.id);
      this.data.suppliers = this.data.suppliers.filter((s) => s.id !== sup.id);
    }

    this.persist();
    deleteUserFromPostgres(id);
    return true;
  }

  async resetUserPassword(userId: string, newPlainPassword: string): Promise<User | undefined> {
    const passwordHash = await bcrypt.hash(newPlainPassword, 10);
    return this.updateUser(userId, { 
      password_hash: passwordHash,
      plain_password: newPlainPassword 
    });
  }

  // --- Suppliers Operations ---
  findSupplierById(id: string): Supplier | undefined {
    return this.data.suppliers.find((s) => s.id === id);
  }

  findSupplierByUserId(userId: string): Supplier | undefined {
    return this.data.suppliers.find((s) => s.user_id === userId);
  }

  getAllSuppliers(): Supplier[] {
    return this.data.suppliers.map((s) => {
      const user = this.findUserById(s.user_id);
      return { ...s, user };
    });
  }

  createSupplier(supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Supplier {
    const now = new Date().toISOString();
    const newSupplier: Supplier = {
      ...supplierData,
      id: `sup_${crypto.randomUUID()}`,
      created_at: now,
      updated_at: now,
    };
    this.data.suppliers.push(newSupplier);
    this.persist();
    syncSupplierToPostgres(newSupplier);
    return newSupplier;
  }

  updateSupplier(id: string, updates: Partial<Supplier>): Supplier | undefined {
    const supplier = this.findSupplierById(id);
    if (!supplier) return undefined;
    Object.assign(supplier, updates, { updated_at: new Date().toISOString() });
    this.persist();
    syncSupplierToPostgres(supplier);
    return supplier;
  }

  // --- Products Operations ---
  findProductById(id: string): Product | undefined {
    return this.data.products.find((p) => p.id === id);
  }

  getProductsBySupplierId(supplierId: string, onlyAvailable = false): Product[] {
    return this.data.products.filter(
      (p) => p.supplier_id === supplierId && (!onlyAvailable || p.is_available)
    );
  }

  createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Product {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id: `prod_${crypto.randomUUID()}`,
      created_at: now,
      updated_at: now,
    };
    this.data.products.push(newProduct);
    this.persist();
    syncProductToPostgres(newProduct);
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>): Product | undefined {
    const prod = this.findProductById(id);
    if (!prod) return undefined;
    Object.assign(prod, updates, { updated_at: new Date().toISOString() });
    this.persist();
    syncProductToPostgres(prod);
    return prod;
  }

  deleteProduct(id: string): boolean {
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.data.products.splice(idx, 1);
    this.persist();
    deleteProductFromPostgres(id);
    return true;
  }

  // --- Orders Operations ---
  findOrderById(id: string): Order | undefined {
    const order = this.data.orders.find((o) => o.id === id);
    if (!order) return undefined;
    return this.hydrateOrder(order);
  }

  getOrdersByReceiverId(receiverId: string): Order[] {
    return this.data.orders
      .filter((o) => o.receiver_id === receiverId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((o) => this.hydrateOrder(o));
  }

  getOrdersBySupplierId(supplierId: string): Order[] {
    return this.data.orders
      .filter((o) => o.supplier_id === supplierId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((o) => this.hydrateOrder(o));
  }

  createOrder(
    orderData: Omit<Order, 'id' | 'status' | 'created_at' | 'updated_at'>,
    items: { productId: string; quantity: number }[]
  ): Order {
    const now = new Date().toISOString();
    const orderId = `ord_${crypto.randomUUID()}`;

    let calculatedTotal = 0;
    const createdItems: OrderItem[] = [];

    items.forEach((item) => {
      const product = this.findProductById(item.productId);
      const unitPrice = product
        ? (product.discount_price !== null && product.discount_price !== undefined
            ? product.discount_price
            : product.price)
        : 0;

      calculatedTotal += unitPrice * item.quantity;

      const orderItem: OrderItem = {
        id: `item_${crypto.randomUUID()}`,
        order_id: orderId,
        product_id: item.productId,
        quantity: item.quantity,
        price_at_order: unitPrice,
      };
      createdItems.push(orderItem);
      this.data.orderItems.push(orderItem);
    });

    const supplier = this.findSupplierById(orderData.supplier_id);
    const deliveryFee = supplier?.is_free_delivery ? 0 : (supplier?.delivery_fee || 0);
    const finalTotal = calculatedTotal + deliveryFee;

    const newOrder: Order = {
      ...orderData,
      id: orderId,
      status: ORDER_STATUSES.PENDING,
      total_price: finalTotal,
      created_at: now,
      updated_at: now,
    };

    this.data.orders.push(newOrder);
    this.persist();

    syncOrderToPostgres(newOrder, createdItems);

    return this.hydrateOrder(newOrder);
  }

  updateOrderStatus(orderId: string, status: OrderStatus, rejectionReason?: string): Order | undefined {
    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order) return undefined;
    order.status = status;
    if (rejectionReason !== undefined) {
      order.rejection_reason = rejectionReason;
    }
    order.updated_at = new Date().toISOString();
    this.persist();

    syncOrderToPostgres(order);

    return this.hydrateOrder(order);
  }

  assignDelivery(orderId: string, deliveryData: Omit<Delivery, 'id' | 'order_id' | 'created_at' | 'updated_at'>): Delivery {
    const now = new Date().toISOString();
    const existingIdx = this.data.deliveries.findIndex((d) => d.order_id === orderId);
    const newDelivery: Delivery = {
      ...deliveryData,
      id: `del_${crypto.randomUUID()}`,
      order_id: orderId,
      created_at: now,
      updated_at: now,
    };

    if (existingIdx !== -1) {
      this.data.deliveries[existingIdx] = newDelivery;
    } else {
      this.data.deliveries.push(newDelivery);
    }

    // Also update order status to PREPARING when delivery info is set
    this.updateOrderStatus(orderId, ORDER_STATUSES.PREPARING);
    this.persist();

    syncDeliveryToPostgres(newDelivery);

    return newDelivery;
  }

  private hydrateOrder(order: Order): Order {
    const items = this.data.orderItems
      .filter((i) => i.order_id === order.id)
      .map((item) => ({
        ...item,
        product: this.findProductById(item.product_id),
      }));

    const delivery = this.data.deliveries.find((d) => d.order_id === order.id) || null;
    const receiver = this.findUserById(order.receiver_id);
    const rawSupplier = this.findSupplierById(order.supplier_id);
    const supplier = rawSupplier ? { ...rawSupplier, user: this.findUserById(rawSupplier.user_id) } : undefined;

    return {
      ...order,
      items,
      delivery,
      receiver,
      supplier,
    };
  }

  getAllUsers(): User[] {
    return this.data.users.map((u) => {
      const { password_hash, ...safeUser } = u as any;
      return safeUser as User;
    });
  }

  getAllOrders(): Order[] {
    return this.data.orders
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((o) => this.hydrateOrder(o));
  }
}

export const db = new DatabaseStore();
