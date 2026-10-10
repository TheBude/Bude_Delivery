# 🚀 Bude Delivery — Backend API

"Bude Delivery" Telegram WebApp platformasi uchun Node.js / Express / TypeScript / Socket.io asosidagi backend API va real-time server.

## 🛠 Texnologiyalar
- **Node.js & Express 5** (TypeScript)
- **Socket.io** (Real-time buyurtma statuslari va audio xabarnomalar)
- **PostgreSQL & Prisma ORM** (Shuningdek, zero-config persistent JSON storage)
- **JWT & HMAC-SHA256** (Telegram initData xavfsiz validatsiyasi)

## 📦 O'rnatish va Ishga Tushirish

```bash
# 1. Kutubxonalarni o'rnatish
cd backend
npm install

# 2. .env faylini sozlash
cp .env.example .env

# 3. Development rejimida ishga tushirish
npm run dev

# 4. Production build va start
npm run build
npm start
```

## 📡 API Endpointlar
- `POST /api/auth/telegram-validate` — Telegram WebApp initData validatsiyasi
- `POST /api/auth/register-email` — Email orqali ro'yxatdan o'tish
- `POST /api/auth/login-email` — Email orqali kirish
- `POST /api/auth/google` — Google auth
- `POST /api/auth/dev-login` — Fast test login (SUPPLIER / RECEIVER)
- `GET /api/suppliers` — Faol ta'minotchilar ro'yxati
- `GET /api/products/supplier/:supplierId` — Ta'minotchi tovarlar katalogi
- `POST /api/orders` — Yangi buyurtma berish (Receiver)
- `POST /api/orders/:id/accept` — Buyurtmani qabul qilish va kuryer biriktirish (Supplier)
- `POST /api/orders/:id/status` — Statusni o'zgartirish (Supplier)
- `POST /api/orders/:id/reject` — Buyurtmani rad etish (Supplier)
- `POST /api/orders/:id/cancel` — Buyurtmani bekor qilish (Receiver, PENDING)
