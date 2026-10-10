// Demo Store for Client Presentations & Pitches
// Completely decoupled from real PostgreSQL database.

export interface DemoUser {
  id: string;
  first_name: string;
  last_name: string;
  phone_primary: string;
  phone_secondary?: string | null;
  role: 'SUPPLIER' | 'RECEIVER';
  language: string;
  email?: string;
}

export interface DemoSupplier {
  id: string;
  user_id: string;
  company_name: string;
  delivery_fee: number;
  is_free_delivery: boolean;
  user?: DemoUser;
}

export interface DemoProduct {
  id: string;
  supplier_id: string;
  name: string;
  description: string;
  price: number;
  discount_price: number | null;
  is_available: boolean;
  quantity_optional?: number | null;
  image_url: string;
}

export interface DemoDelivery {
  id: string;
  order_id: string;
  vehicle_model: string;
  vehicle_plate_number: string;
  driver_name: string;
  driver_phone: string;
}

export interface DemoOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_order: number;
  product?: DemoProduct;
}

export interface DemoOrder {
  id: string;
  receiver_id: string;
  supplier_id: string;
  status: 'PENDING' | 'PREPARING' | 'IN_TRANSIT' | 'DELIVERED' | 'REJECTED';
  delivery_lat: number;
  delivery_lng: number;
  delivery_address: string;
  delivery_time_slot: string;
  notes?: string | null;
  total_price: number;
  rejection_reason?: string | null;
  created_at: string;
  items: DemoOrderItem[];
  delivery?: DemoDelivery | null;
  supplier?: DemoSupplier;
  receiver?: DemoUser;
}

const INITIAL_DEMO_USERS: Record<string, DemoUser> = {
  usr_demo_receiver: {
    id: 'usr_demo_receiver',
    first_name: 'Bobur',
    last_name: 'Mirzayev',
    phone_primary: '+998 90 333 22 11',
    phone_secondary: '+998 93 456 78 90',
    role: 'RECEIVER',
    language: 'uz',
    email: 'receiver@bude.uz',
  },
  usr_demo_supplier: {
    id: 'usr_demo_supplier',
    first_name: 'Akmal',
    last_name: 'Rahimov',
    phone_primary: '+998 90 123 45 67',
    role: 'SUPPLIER',
    language: 'uz',
    email: 'supplier@bude.uz',
  },
  usr_demo_supplier_2: {
    id: 'usr_demo_supplier_2',
    first_name: 'Dilshod',
    last_name: 'Karimov',
    phone_primary: '+998 97 765 43 21',
    role: 'SUPPLIER',
    language: 'uz',
    email: 'agro@bude.uz',
  },
};

const INITIAL_DEMO_SUPPLIERS: DemoSupplier[] = [
  {
    id: 'sup_buxoro_fresh',
    user_id: 'usr_demo_supplier',
    company_name: 'Buxoro Fresh Market & Logistics',
    delivery_fee: 15000,
    is_free_delivery: false,
    user: INITIAL_DEMO_USERS.usr_demo_supplier,
  },
  {
    id: 'sup_agro_mega',
    user_id: 'usr_demo_supplier_2',
    company_name: "Toshkent Mega Agro Ta'minot",
    delivery_fee: 0,
    is_free_delivery: true,
    user: INITIAL_DEMO_USERS.usr_demo_supplier_2,
  },
];

const INITIAL_DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: 'prod_1',
    supplier_id: 'sup_buxoro_fresh',
    name: 'Olma Golden (Vodil saralangan)',
    description: "Eng shirin va suvli Oltiariq olmalari, yangi uzilgan tabiiy mahsulot",
    price: 18000,
    discount_price: 15000,
    is_available: true,
    quantity_optional: 50,
    image_url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&auto=format&fit=crop&q=60',
  },
  {
    id: 'prod_2',
    supplier_id: 'sup_buxoro_fresh',
    name: 'Pomidor Qizil (Issiqxona)',
    description: "Tabiiy go'shtdor qizil pomidor, a'lo sifat, to'g'ridan-to'g'ri issiqxonadan",
    price: 22000,
    discount_price: null,
    is_available: true,
    quantity_optional: 30,
    image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=60',
  },
  {
    id: 'prod_3',
    supplier_id: 'sup_buxoro_fresh',
    name: 'Bodring Bodomiy',
    description: "Yangi uzilgan qarsildoq bodomiy bodring, qadoqlangan",
    price: 14000,
    discount_price: 12000,
    is_available: true,
    quantity_optional: 40,
    image_url: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400&auto=format&fit=crop&q=60',
  },
  {
    id: 'prod_4',
    supplier_id: 'sup_buxoro_fresh',
    name: "Tog' Asali (1 kg, Tabiiy)",
    description: "Chotqol tog'larining 100% tabiiy toza gul asali, shifobaxsh",
    price: 85000,
    discount_price: 79000,
    is_available: true,
    quantity_optional: 15,
    image_url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&auto=format&fit=crop&q=60',
  },
  {
    id: 'prod_5',
    supplier_id: 'sup_agro_mega',
    name: 'Tabiiy Sut 3.2% (1 litr)',
    description: 'Pasterizatsiyalangan yangi sut, kundalik yetkazib berish',
    price: 9000,
    discount_price: null,
    is_available: true,
    quantity_optional: 100,
    image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=60',
  },
  {
    id: 'prod_6',
    supplier_id: 'sup_agro_mega',
    name: "Fermer Sariyog'i (82.5%, 500g)",
    description: "Oliy navli tabiiy qaymoqli sariyog', ekologik toza",
    price: 42000,
    discount_price: 38000,
    is_available: true,
    quantity_optional: 25,
    image_url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&auto=format&fit=crop&q=60',
  },
  {
    id: 'prod_7',
    supplier_id: 'sup_agro_mega',
    name: "Qaymoq Qishloq (1 kg)",
    description: "Qalin va shirin an'anaviy qishloq qaymog'i",
    price: 55000,
    discount_price: null,
    is_available: true,
    quantity_optional: 20,
    image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=60',
  },
];

const INITIAL_DEMO_ORDERS: DemoOrder[] = [
  {
    id: 'ord_demo_live_7842',
    receiver_id: 'usr_demo_receiver',
    supplier_id: 'sup_buxoro_fresh',
    status: 'IN_TRANSIT',
    delivery_lat: 41.311081,
    delivery_lng: 69.240562,
    delivery_address: 'Toshkent sh., Chilonzor tumani, 9-mavze, 24-uy',
    delivery_time_slot: '14:00 - 16:00',
    notes: "Iltimos eshik qo'ng'irog'ini chaling, 3-qavat",
    total_price: 67000,
    created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    items: [
      {
        id: 'item_1',
        order_id: 'ord_demo_live_7842',
        product_id: 'prod_1',
        quantity: 2,
        price_at_order: 15000,
        product: INITIAL_DEMO_PRODUCTS[0],
      },
      {
        id: 'item_2',
        order_id: 'ord_demo_live_7842',
        product_id: 'prod_2',
        quantity: 1,
        price_at_order: 22000,
        product: INITIAL_DEMO_PRODUCTS[1],
      },
    ],
    delivery: {
      id: 'del_1',
      order_id: 'ord_demo_live_7842',
      vehicle_model: 'Chevrolet Cobalt (Oq)',
      vehicle_plate_number: '01 A 777 AA',
      driver_name: 'Jamshid Aliyev',
      driver_phone: '+998 91 234 56 78',
    },
    supplier: INITIAL_DEMO_SUPPLIERS[0],
    receiver: INITIAL_DEMO_USERS.usr_demo_receiver,
  },
  {
    id: 'ord_demo_pending_9021',
    receiver_id: 'usr_demo_receiver',
    supplier_id: 'sup_buxoro_fresh',
    status: 'PENDING',
    delivery_lat: 41.320000,
    delivery_lng: 69.250000,
    delivery_address: 'Yunusobod tumani, 4-mavze, 12-uy',
    delivery_time_slot: '16:00 - 18:00',
    notes: "Iloji bo'lsa yangiroqlaridan tanlab berasiz",
    total_price: 106000,
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    items: [
      {
        id: 'item_3',
        order_id: 'ord_demo_pending_9021',
        product_id: 'prod_4',
        quantity: 1,
        price_at_order: 79000,
        product: INITIAL_DEMO_PRODUCTS[3],
      },
      {
        id: 'item_4',
        order_id: 'ord_demo_pending_9021',
        product_id: 'prod_3',
        quantity: 1,
        price_at_order: 12000,
        product: INITIAL_DEMO_PRODUCTS[2],
      },
    ],
    delivery: null,
    supplier: INITIAL_DEMO_SUPPLIERS[0],
    receiver: INITIAL_DEMO_USERS.usr_demo_receiver,
  },
  {
    id: 'ord_demo_past_6519',
    receiver_id: 'usr_demo_receiver',
    supplier_id: 'sup_agro_mega',
    status: 'DELIVERED',
    delivery_lat: 41.311081,
    delivery_lng: 69.240562,
    delivery_address: "Toshkent sh., Amir Temur shox ko'chasi, 45-uy",
    delivery_time_slot: '11:00 - 13:00',
    notes: null,
    total_price: 65000,
    created_at: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    items: [
      {
        id: 'item_5',
        order_id: 'ord_demo_past_6519',
        product_id: 'prod_5',
        quantity: 3,
        price_at_order: 9000,
        product: INITIAL_DEMO_PRODUCTS[4],
      },
      {
        id: 'item_6',
        order_id: 'ord_demo_past_6519',
        product_id: 'prod_6',
        quantity: 1,
        price_at_order: 38000,
        product: INITIAL_DEMO_PRODUCTS[5],
      },
    ],
    delivery: {
      id: 'del_2',
      order_id: 'ord_demo_past_6519',
      vehicle_model: 'Damas Van Deluxe',
      vehicle_plate_number: '10 B 456 BB',
      driver_name: 'Farrux Tursunov',
      driver_phone: '+998 90 111 22 33',
    },
    supplier: INITIAL_DEMO_SUPPLIERS[1],
    receiver: INITIAL_DEMO_USERS.usr_demo_receiver,
  },
];

const STORAGE_KEY = 'bude_demo_state_v1';

interface DemoState {
  users: Record<string, DemoUser>;
  suppliers: DemoSupplier[];
  products: DemoProduct[];
  orders: DemoOrder[];
  activeRole: 'SUPPLIER' | 'RECEIVER';
}

function loadState(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading demo state:', e);
  }

  const initial: DemoState = {
    users: { ...INITIAL_DEMO_USERS },
    suppliers: JSON.parse(JSON.stringify(INITIAL_DEMO_SUPPLIERS)),
    products: JSON.parse(JSON.stringify(INITIAL_DEMO_PRODUCTS)),
    orders: JSON.parse(JSON.stringify(INITIAL_DEMO_ORDERS)),
    activeRole: 'RECEIVER',
  };
  saveState(initial);
  return initial;
}

function saveState(state: DemoState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving demo state:', e);
  }
}

let state = loadState();

export const demoStore = {
  resetToDefault() {
    state = {
      users: { ...INITIAL_DEMO_USERS },
      suppliers: JSON.parse(JSON.stringify(INITIAL_DEMO_SUPPLIERS)),
      products: JSON.parse(JSON.stringify(INITIAL_DEMO_PRODUCTS)),
      orders: JSON.parse(JSON.stringify(INITIAL_DEMO_ORDERS)),
      activeRole: 'RECEIVER',
    };
    saveState(state);
  },

  // Auth
  loginRole(role: 'SUPPLIER' | 'RECEIVER') {
    state.activeRole = role;
    saveState(state);
    if (role === 'SUPPLIER') {
      const user = state.users.usr_demo_supplier;
      const supplier = state.suppliers[0];
      return {
        token: 'demo_token_supplier',
        user,
        supplier,
      };
    } else {
      const user = state.users.usr_demo_receiver;
      return {
        token: 'demo_token_receiver',
        user,
        supplier: null,
      };
    }
  },

  getMe() {
    if (state.activeRole === 'SUPPLIER') {
      return {
        user: state.users.usr_demo_supplier,
        supplier: state.suppliers[0],
      };
    } else {
      return {
        user: state.users.usr_demo_receiver,
        supplier: null,
      };
    }
  },

  updateProfile(profile: Partial<DemoUser>) {
    const userKey = state.activeRole === 'SUPPLIER' ? 'usr_demo_supplier' : 'usr_demo_receiver';
    state.users[userKey] = {
      ...state.users[userKey],
      ...profile,
    };
    saveState(state);
    return {
      success: true,
      user: state.users[userKey],
      supplier: state.activeRole === 'SUPPLIER' ? state.suppliers[0] : null,
    };
  },


  // Suppliers
  getSuppliers(params?: { q?: string; free_delivery?: boolean }) {
    let list = state.suppliers.map((sup) => {
      const prods = state.products.filter((p) => p.supplier_id === sup.id && p.is_available);
      return {
        ...sup,
        products: prods,
      };
    });

    if (params?.q) {
      const query = params.q.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.company_name.toLowerCase().includes(query) ||
          s.products.some((p) => p.name.toLowerCase().includes(query))
      );
    }

    if (params?.free_delivery) {
      list = list.filter((s) => s.is_free_delivery);
    }

    return list;
  },

  getSupplierById(id: string) {
    const sup = state.suppliers.find((s) => s.id === id);
    if (!sup) throw new Error("Ta'minotchi topilmadi");
    const prods = state.products.filter((p) => p.supplier_id === id);
    return { ...sup, products: prods };
  },

  updateSupplierSettings(settings: { company_name?: string; delivery_fee?: number; is_free_delivery?: boolean }) {
    const sup = state.suppliers[0];
    if (sup) {
      if (settings.company_name !== undefined) sup.company_name = settings.company_name;
      if (settings.delivery_fee !== undefined) sup.delivery_fee = settings.delivery_fee;
      if (settings.is_free_delivery !== undefined) sup.is_free_delivery = settings.is_free_delivery;
      saveState(state);
      return { supplier: sup };
    }
    throw new Error('Supplier topilmadi');
  },

  // Products
  getProductsBySupplier(supplierId: string, all = false) {
    return state.products.filter((p) => p.supplier_id === supplierId && (all || p.is_available));
  },

  createProduct(data: any) {
    const newProduct: DemoProduct = {
      id: `prod_demo_${Date.now()}`,
      supplier_id: data.supplier_id || state.suppliers[0].id,
      name: data.name,
      description: data.description || '',
      price: Number(data.price),
      discount_price: data.discount_price ? Number(data.discount_price) : null,
      is_available: data.is_available ?? true,
      quantity_optional: data.quantity_optional ? Number(data.quantity_optional) : null,
      image_url: data.image_url || 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&auto=format&fit=crop&q=60',
    };
    state.products.unshift(newProduct);
    saveState(state);
    return { product: newProduct };
  },

  updateProduct(id: string, data: any) {
    const idx = state.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Mahsulot topilmadi');
    state.products[idx] = {
      ...state.products[idx],
      name: data.name ?? state.products[idx].name,
      description: data.description ?? state.products[idx].description,
      price: data.price !== undefined ? Number(data.price) : state.products[idx].price,
      discount_price: data.discount_price !== undefined ? (data.discount_price ? Number(data.discount_price) : null) : state.products[idx].discount_price,
      is_available: data.is_available ?? state.products[idx].is_available,
      quantity_optional: data.quantity_optional !== undefined ? (data.quantity_optional ? Number(data.quantity_optional) : null) : state.products[idx].quantity_optional,
      image_url: data.image_url ?? state.products[idx].image_url,
    };
    saveState(state);
    return { product: state.products[idx] };
  },

  toggleProductAvailability(id: string, is_available?: boolean) {
    const idx = state.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Mahsulot topilmadi');
    const newStatus = is_available !== undefined ? is_available : !state.products[idx].is_available;
    state.products[idx].is_available = newStatus;
    saveState(state);
    return { product: state.products[idx] };
  },

  deleteProduct(id: string) {
    state.products = state.products.filter((p) => p.id !== id);
    saveState(state);
    return { success: true };
  },

  // Orders
  getReceiverOrders() {
    return state.orders.map((ord) => {
      const sup = state.suppliers.find((s) => s.id === ord.supplier_id);
      return {
        ...ord,
        supplier: sup,
        items: ord.items.map((i) => ({
          ...i,
          product: state.products.find((p) => p.id === i.product_id) || i.product,
        })),
      };
    });
  },

  getSupplierOrders() {
    const mySupId = state.suppliers[0].id;
    return state.orders
      .filter((ord) => ord.supplier_id === mySupId)
      .map((ord) => {
        const sup = state.suppliers.find((s) => s.id === ord.supplier_id);
        const receiver = state.users[ord.receiver_id] || INITIAL_DEMO_USERS.usr_demo_receiver;
        return {
          ...ord,
          supplier: sup,
          receiver,
          items: ord.items.map((i) => ({
            ...i,
            product: state.products.find((p) => p.id === i.product_id) || i.product,
          })),
        };
      });
  },

  getOrderById(id: string) {
    const ord = state.orders.find((o) => o.id === id);
    if (!ord) throw new Error('Buyurtma topilmadi');
    const sup = state.suppliers.find((s) => s.id === ord.supplier_id);
    const receiver = state.users[ord.receiver_id] || INITIAL_DEMO_USERS.usr_demo_receiver;
    return {
      ...ord,
      supplier: sup,
      receiver,
      items: ord.items.map((i) => ({
        ...i,
        product: state.products.find((p) => p.id === i.product_id) || i.product,
      })),
    };
  },

  createOrder(data: {
    supplier_id: string;
    items: Array<{ productId: string; quantity: number }>;
    delivery_lat: number;
    delivery_lng: number;
    delivery_address: string;
    delivery_time_slot: string;
    notes?: string | null;
  }) {
    const sup = state.suppliers.find((s) => s.id === data.supplier_id) || state.suppliers[0];
    let subtotal = 0;
    const orderId = `ord_demo_${Date.now().toString().slice(-4)}`;

    const orderItems: DemoOrderItem[] = data.items.map((item, idx) => {
      const prod = state.products.find((p) => p.id === item.productId);
      const unitPrice = prod?.discount_price ?? prod?.price ?? 10000;
      subtotal += unitPrice * item.quantity;
      return {
        id: `item_demo_${Date.now()}_${idx}`,
        order_id: orderId,
        product_id: item.productId,
        quantity: item.quantity,
        price_at_order: unitPrice,
        product: prod,
      };
    });

    const deliveryFee = sup.is_free_delivery ? 0 : sup.delivery_fee;
    const totalPrice = subtotal + deliveryFee;

    const newOrder: DemoOrder = {
      id: orderId,
      receiver_id: 'usr_demo_receiver',
      supplier_id: data.supplier_id,
      status: 'PENDING',
      delivery_lat: data.delivery_lat,
      delivery_lng: data.delivery_lng,
      delivery_address: data.delivery_address,
      delivery_time_slot: data.delivery_time_slot,
      notes: data.notes || null,
      total_price: totalPrice,
      created_at: new Date().toISOString(),
      items: orderItems,
      delivery: null,
      supplier: sup,
      receiver: state.users.usr_demo_receiver,
    };

    state.orders.unshift(newOrder);
    saveState(state);

    return { order: newOrder };
  },

  acceptOrder(
    id: string,
    courier: { vehicle_model: string; vehicle_plate_number: string; driver_name: string; driver_phone: string }
  ) {
    const idx = state.orders.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Buyurtma topilmadi');

    const delivery: DemoDelivery = {
      id: `del_demo_${Date.now()}`,
      order_id: id,
      vehicle_model: courier.vehicle_model,
      vehicle_plate_number: courier.vehicle_plate_number,
      driver_name: courier.driver_name,
      driver_phone: courier.driver_phone,
    };

    state.orders[idx].status = 'PREPARING';
    state.orders[idx].delivery = delivery;
    saveState(state);

    return { order: state.orders[idx] };
  },

  updateOrderStatus(id: string, status: string) {
    const idx = state.orders.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Buyurtma topilmadi');

    state.orders[idx].status = status as any;
    saveState(state);

    return { order: state.orders[idx] };
  },

  rejectOrder(id: string, rejection_reason: string) {
    const idx = state.orders.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Buyurtma topilmadi');

    state.orders[idx].status = 'REJECTED';
    state.orders[idx].rejection_reason = rejection_reason;
    saveState(state);

    return { order: state.orders[idx] };
  },

  cancelOrder(id: string, reason?: string) {
    const idx = state.orders.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Buyurtma topilmadi');

    if (state.orders[idx].status !== 'PENDING') {
      throw new Error('Faqat kutilayotgan buyurtmani bekor qilish mumkin');
    }

    state.orders[idx].status = 'REJECTED';
    state.orders[idx].rejection_reason = reason || 'Xaridor tomonidan bekor qilindi';
    saveState(state);

    return { order: state.orders[idx] };
  },
};

