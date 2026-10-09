# 🚚 Bude Delivery — Telegram WebApp (Mini App) Logistika & Yetkazib Berish Tizimi

"Bude Delivery" — Telegram WebApp (Mini App) platformasi uchun maxsus ishlab chiqilgan zamonaviy B2B/B2C logistika, savdo va yetkazib berish ekotizimi. Ushbu tizim ta'minotchilar (Suppliers) va qabul qiluvchilar (Receivers/Mijozlar) o'rtasida real-time buyurtmalar almashinuvi, kuryerlarni biriktirish, xarita asosida geolokatsiyani aniqlash va ko'p tillilikni ta'minlaydi.

---

## 🌟 Asosiy Imkoniyatlar va Funksionallik

### 1. Autentifikatsiya va Profil Boshqaruvi
- **Telegram WebApp Integratsiyasi**: `initData` orqali HMAC-SHA256 xavfsiz validatsiya va JWT asosidagi sessiya.
- **Rollar tizimi (Majburiy)**:
  - 📦 **Ta'minotchi (Supplier)**: Mahsulotlar katalogi, yetkazish narxlari, buyurtmalarni qabul qilish va transport biriktirish.
  - 🛒 **Qabul qiluvchi (Receiver)**: Ta'minotchilar katalogi, savat, interaktiv xaritadan geolokatsiya tanlash, real-time monitoring.
- **Ko'p tillilik (i18n)**: O'zbek (UZ), Rus (RU), Ingliz (EN) tillarida to'liq dinamik lokalizatsiya va har doim ochiq til almashtirgich.
- **Brauzer / Dev Rejimi**: Telegram mijozi bo'lmagan holatda ham tizimni sinovdan o'tkazish uchun 1-bosishda rollar orasida almashuvchi Telegram Mini App Simulyatori.

### 2. "Qabul qiluvchi" (Receiver) Imkoniyatlari
- **Faol Ta'minotchilar vitrinasi**: Real-time qidiruv, bepul yetkazish filtri, ta'minotchi ma'lumotlari va faol tovarlar soni.
- **Tovar katalogi va Savat**:
  - Faqat sotuvda mavjud (`is_available = true`) tovarlar ko'rsatiladi.
  - Soni (miqdori) ixtiyoriy, chegirmali narxlar (aksiya) va fotosuratlar.
  - Silliq mikro-animatsiyali suzuvchi Savat (Floating Cart Drawer).
- **Checkout Jarayoni**:
  - **Interaktiv Xarita (Leaflet & OpenStreetMap)**: Markerni surish, GPS orqali avtomatik joriy lokatsiyani aniqlash va Nominatim teskari geocoding.
  - **Vaqt oralig'i (Time Slots)**: `09:00 - 11:00`, `11:00 - 13:00`, `14:00 - 16:00`, `16:00 - 18:00`, `18:00 - 20:00`.
  - Kuryer uchun qo'shimcha eslatma / izohlar.
- **Monitoring va Tarix**:
  - Real-time buyurtma statuslari (Socket.io orqali sahifani yangilamasdan lahzali o'zgaradi):
    `Kutilmoqda` ➔ `Tasdiqlandi (Yuk yig'ilmoqda)` ➔ `Yo'lga chiqdi` ➔ `Yetkazildi` / `Bekor qilindi`.
  - Biriktirilgan kuryer/avtomobil kartochkasi: Avtomobil rusumi, Davlat raqami, Haydovchi ismi, direct qo'ng'iroq qilish tugmasi (`tel:`).
  - Moliyaviy monitoring: Har bir buyurtma sanasi, mahsulotlar narxi, yetkazib berish xarajati va yakuniy summa.

### 3. "Ta'minotchi" (Supplier) Imkoniyatlari
- **Real-Time Buyurtmalar Boshqaruvi (Dashboard)**:
  - Yangi buyurtma kelganda **Web Audio API** orqali yoqimli audio signal va vizual badge bildirishnomasi.
  - **Buyurtmani qabul qilish**: Transport ma'lumotlarini (Avto rusumi, Davlat raqami, Haydovchi ismi va telefoni) kiritish modali ochiladi.
  - **Statuslarni boshqarish**: "Yuk yig'ilmoqda" ➔ "Yo'lga chiqdi" ➔ "Yetkazildi".
  - **Buyurtmani rad etish**: Majburiy "Rad etish sababi" bilan bekor qilish.
- **Tovar Boshqaruvi**:
  - Tovar qo'shish, tahrirlash va o'chirish.
  - Asosiy narx, chegirmali narx (aksiya) va tavsif.
  - "Mavjud" / "Mavjud emas" tezkor switcheri (Telegram Haptic tebranishi bilan).
  - Tayyor rasm shablonlari yoki shaxsiy rasm havolasi.
- **Yetkazib berish sozlamalari**:
  - Kompaniya / do'kon nomi.
  - Standart yetkazib berish narxini belgilash yoki "Yetkazib berish bepul" opsiyasini faollashtirish.

---

## 🛠 Texnologik Stek

| Qatlam | Texnologiyalar |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React, Leaflet, i18next, @twa-dev/sdk |
| **Backend** | Node.js, Express, TypeScript, Socket.io, Zod, JWT, Crypto (HMAC-SHA256) |
| **Database** | PostgreSQL (Prisma ORM & Native SQL) + Zero-config Persistent Local Engine |
| **Real-time** | WebSockets (Socket.io) xonalar arxitekturasi (`supplier:*`, `receiver:*`, `order:*`) |
| **UX & Haptics** | Telegram Haptic Feedback (`impact`, `notification`, `selection`) + Web Audio Synthesizer |

---

## 📂 Loyiha Strukturasi

```text
D:\Bude_Delivery/
├── backend/
│   ├── database/
│   │   └── schema.sql                # Production PostgreSQL SQL sxemasi (indekslar, enum, triggers)
│   ├── prisma/
│   │   └── schema.prisma             # PostgreSQL Prisma ORM sxemasi
│   ├── src/
│   │   ├── config/                   # Muhit parametrlari (.env)
│   │   ├── db/
│   │   │   └── storage.ts            # Persistent DB Store (Prisma/PostgreSQL bilan muvofiq)
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts     # JWT va Role Guard (requireRole)
│   │   ├── routes/
│   │   │   ├── authRoutes.ts         # Telegram initData, registratsiya, dev-login
│   │   │   ├── orderRoutes.ts        # Buyurtmalar, kuryer biriktirish, rad etish
│   │   │   ├── productRoutes.ts      # Mahsulotlar CRUD va availability toggle
│   │   │   └── supplierRoutes.ts     # Ta'minotchilar ro'yxati va sozlamalar
│   │   ├── socket/
│   │   │   └── index.ts              # Socket.io real-time hodisalar dispetcheri
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript domen tiplari
│   │   ├── utils/
│   │   │   └── telegramAuth.ts       # Telegram HMAC-SHA256 initData validatsiyasi
│   │   ├── seed.ts                   # Boshlang'ich test ma'lumotlari
│   │   └── server.ts                 # Express va HTTP server
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts             # REST API mijoz so'rovlari
│   │   │   └── socket.ts             # Socket.io mijoz ulanishi
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   └── RegisterScreen.tsx# Rol tanlash va ro'yxatdan o'tish
│   │   │   ├── common/
│   │   │   │   ├── Header.tsx        # Brending, til tanlash (UZ/RU/EN), dark rejim
│   │   │   │   └── LocationPicker.tsx# Leaflet xarita, GPS va geocoding
│   │   │   ├── receiver/
│   │   │   │   ├── CartCheckoutModal.tsx     # Savat va buyurtma tasdig'i
│   │   │   │   ├── ReceiverDashboard.tsx     # Qabul qiluvchi bosh sahifasi
│   │   │   │   ├── ReceiverOrdersHistory.tsx # Status progress stepper va kuryer kartasi
│   │   │   │   ├── SupplierCatalogModal.tsx  # Tovar katalogi va savatga qo'shish
│   │   │   │   └── SupplierList.tsx          # Ta'minotchilar qidiruv vitrinasi
│   │   │   └── supplier/
│   │   │       ├── SupplierDashboard.tsx     # Ta'minotchi bosh paneli
│   │   │       ├── SupplierOrdersTab.tsx     # Yangi buyurtmalar, kuryer modali, rad sababi
│   │   │       ├── SupplierProductsTab.tsx   # Tovar qo'shish/tahrirlash/stock switch
│   │   │       └── SupplierSettingsTab.tsx   # Yetkazish tarifi va bepul yetkazish
│   │   ├── context/
│   │   │   ├── AuthContext.tsx       # Sessiya, profil va rollar
│   │   │   └── CartContext.tsx       # Savat kalkulyatsiyasi va boshqaruvi
│   │   ├── i18n/
│   │   │   ├── index.ts
│   │   │   └── locales/              # uz.json, ru.json, en.json
│   │   ├── utils/
│   │   │   └── telegram.ts           # Haptics, WebApp expand, Audio signal
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
└── package.json                      # Birlashgan loyiha scriptlari
```

---

## 🗄 Ma'lumotlar Bazasi Sxemasi (PostgreSQL & Prisma)

Quyidagi PostgreSQL jadvallari va indekslari `backend/database/schema.sql` va `backend/prisma/schema.prisma` da to'liq realizatsiya qilingan:

1. **`users`**:
   - `id`, `telegram_id` (Unique, BigInt), `role` (`SUPPLIER` / `RECEIVER`), `first_name`, `last_name`, `phone_primary`, `phone_secondary`, `language`, `created_at`, `updated_at`.
   - Indekslar: `idx_users_telegram_id`, `idx_users_role`, `idx_users_phone_primary`.
2. **`suppliers`**:
   - `id`, `user_id` (Foreign Key, Cascade), `company_name`, `delivery_fee`, `is_free_delivery`, `created_at`, `updated_at`.
   - Indekslar: `idx_suppliers_user_id`, `idx_suppliers_company_name`.
3. **`products`**:
   - `id`, `supplier_id` (Foreign Key, Cascade), `name`, `description`, `price`, `discount_price`, `is_available`, `quantity_optional`, `image_url`, `created_at`, `updated_at`.
   - Indekslar: `idx_products_supplier_id`, `idx_products_is_available`, `idx_products_price`.
4. **`orders`**:
   - `id`, `receiver_id`, `supplier_id`, `status` (`PENDING`, `PREPARING`, `IN_TRANSIT`, `DELIVERED`, `REJECTED`), `delivery_lat`, `delivery_lng`, `delivery_address`, `delivery_time_slot`, `notes`, `total_price`, `rejection_reason`, `created_at`, `updated_at`.
   - Indekslar: `idx_orders_receiver_id`, `idx_orders_supplier_id`, `idx_orders_status`, `idx_orders_created_at`.
5. **`order_items`**:
   - `id`, `order_id`, `product_id`, `quantity`, `price_at_order`.
   - Indekslar: `idx_order_items_order_id`, `idx_order_items_product_id`.
6. **`deliveries`**:
   - `id`, `order_id` (Unique), `vehicle_model`, `vehicle_plate_number`, `driver_name`, `driver_phone`, `created_at`, `updated_at`.
   - Indekslar: `idx_deliveries_order_id`, `idx_deliveries_driver_phone`.

---

## 🚀 Loyihani Ishga Tushirish

### 1. Talablar
- Node.js v18+ (tavsiya etiladi v20+)
- npm / yarn / pnpm

### 2. O'rnatish
```bash
# Backend paketlarini o'rnatish
cd backend
npm install

# Frontend paketlarini o'rnatish
cd ../frontend
npm install
```

### 3. Ishga tushirish (Development rejimi)

**1-terminalda (Backend):**
```bash
cd backend
npm run dev
# Server ishga tushadi: http://localhost:5000
# WebSocket: ws://localhost:5000
```

**2-terminalda (Frontend):**
```bash
cd frontend
npm run dev
# Ilova ishga tushadi: http://localhost:3000
```

*Frontend avtomatik ravishda `/api` va `/socket.io` so'rovlarini backend portiga (5000) proksi qiladi.*

---

## 🤖 Telegram Botga Ulash (BotFather orqali)

1. `@BotFather` da yangi bot yarating yoki mavjud botni tanlang.
2. `/newapp` buyrug'ini yuboring va botingizni tanlang.
3. Web App nomini kiriting: `Bude Delivery`.
4. Web App URL manzilini kiriting (masalan, `ngrok` yoki HTTPS domeningiz: `https://your-domain.com`).
5. `backend/.env` faylidagi `TELEGRAM_BOT_TOKEN` parametriga BotFather bergan tokenni yozing.
6. Telegram orqali Web App ochilganda, foydalanuvchi ma'lumotlari avtomatik ravishda xavfsiz tasdiqlanadi.

---

## 💡 Sinovdan O'tkazish (Demo & Browser Test)

Tizimni Telegram mijozi ochilmagan holda ham to'liq sinovdan o'tkazish uchun yuqoridagi **Telegram Mini App Simulyatori** mavjud:
- **"Ta'minotchi"** tugmasini bosing: "Buxoro Fresh Market" akkauntiga kiradi va tushgan buyurtmalarni qabul qilish, transport biriktirish yoki rad etishni sinashingiz mumkin.
- **"Qabul qiluvchi"** tugmasini bosing: "Bobur Mirzayev" akkauntiga kiradi, ta'minotchilardan tovarlarni savatga qo'shish, xaritadan lokatsiya tanlash va buyurtma berishni sinashingiz mumkin.
- Bitta brauzerda 2 ta turli oynada (yoki Incognito) ochib, yangi buyurtma berilganda ta'minotchi oynasida **ovozli signal va real-time holat o'zgarishini** bevosita ko'rish mumkin!
