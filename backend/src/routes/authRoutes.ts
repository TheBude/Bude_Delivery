import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db/storage';
import { config } from '../config';
import { validateTelegramInitData } from '../utils/telegramAuth';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { AuthTokenPayload, Role, User } from '../types';

export const authRouter = Router();

function generateToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '30d' });
}

// 1. Validate Telegram WebApp initData
authRouter.post('/telegram-validate', (req: Request, res: Response): void => {
  const { initData } = req.body;

  if (!initData) {
    res.status(400).json({ error: 'initData majburiy parametr' });
    return;
  }

  // Validate HMAC signature
  const validation = validateTelegramInitData(initData, config.telegramBotToken);

  let telegramId: number;
  let firstName: string;
  let lastName: string;

  if (validation.isValid && validation.data?.user) {
    telegramId = validation.data.user.id;
    firstName = validation.data.user.first_name;
    lastName = validation.data.user.last_name || '';
  } else {
    // If not in strict production or dev mode, check if we can parse unsafe user data for demo/testing
    if (config.allowDevLogin) {
      try {
        const urlParams = new URLSearchParams(initData);
        const userJson = urlParams.get('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          telegramId = user.id;
          firstName = user.first_name;
          lastName = user.last_name || '';
        } else {
          res.status(401).json({ error: 'Telegram initData tekshiruvdan o\'tmadi: ' + validation.error });
          return;
        }
      } catch (e) {
        res.status(401).json({ error: 'Telegram initData formati noto\'g\'ri' });
        return;
      }
    } else {
      res.status(401).json({ error: 'Telegram initData tekshiruvdan o\'tmadi: ' + validation.error });
      return;
    }
  }

  // Check if user exists in database
  const existingUser = db.findUserByTelegramId(telegramId);

  if (!existingUser) {
    res.json({
      isNewUser: true,
      telegramUser: {
        id: telegramId,
        first_name: firstName,
        last_name: lastName,
      },
    });
    return;
  }

  const supplier = existingUser.role === 'SUPPLIER' ? db.findSupplierByUserId(existingUser.id) : undefined;
  const token = generateToken({
    userId: existingUser.id,
    telegramId: existingUser.telegram_id,
    email: existingUser.email,
    role: existingUser.role,
  });

  res.json({
    isNewUser: false,
    user: existingUser,
    supplier,
    token,
  });
});

// 2. Email & Password Registration
const registerEmailSchema = z.object({
  email: z.string().email('Email manzili noto\'g\'ri formatda'),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
  role: z.enum(['SUPPLIER', 'RECEIVER']),
  first_name: z.string().min(1, 'Ism kiritilishi shart'),
  last_name: z.string().min(1, 'Familiya kiritilishi shart'),
  phone_primary: z.string().min(7, 'Asosiy telefon raqami kiritilishi shart'),
  phone_secondary: z.string().optional().nullable(),
  language: z.enum(['uz', 'ru', 'en']).default('uz'),
  company_name: z.string().optional(),
  delivery_fee: z.number().min(0).optional(),
  is_free_delivery: z.boolean().optional(),
});

authRouter.post('/register-email', async (req: Request, res: Response): Promise<void> => {
  const result = registerEmailSchema.safeParse(req.body);

  if (!result.success) {
    const errorMsg = (result.error as any).issues?.[0]?.message || result.error.message || 'Ma\'lumotlar to\'liq emas';
    res.status(400).json({ error: errorMsg });
    return;
  }

  const data = result.data;
  const normalizedEmail = data.email.trim().toLowerCase();

  // Check if email already exists
  const existingUser = db.findUserByEmail(normalizedEmail);
  if (existingUser) {
    res.status(400).json({ error: 'Ushbu email bilan allaqachon ro\'yxatdan o\'tilgan. Kirish sahifasidan foydalaning.' });
    return;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const newUser = db.createUser({
    telegram_id: null,
    email: normalizedEmail,
    password_hash: passwordHash,
    google_id: null,
    avatar_url: null,
    role: data.role as Role,
    first_name: data.first_name.trim(),
    last_name: data.last_name.trim(),
    phone_primary: data.phone_primary.trim(),
    phone_secondary: data.phone_secondary?.trim() || null,
    language: data.language,
  });

  let supplier: any = undefined;
  if (newUser.role === 'SUPPLIER') {
    const companyName = data.company_name?.trim() || `${newUser.first_name} Yetkazib Berish`;
    supplier = db.createSupplier({
      user_id: newUser.id,
      company_name: companyName,
      delivery_fee: data.delivery_fee ?? 15000,
      is_free_delivery: data.is_free_delivery ?? false,
    });
  }

  const token = generateToken({
    userId: newUser.id,
    email: newUser.email,
    telegramId: newUser.telegram_id,
    role: newUser.role,
  });

  res.status(201).json({
    message: 'Ro\'yxatdan muvaffaqiyatli o\'tildi',
    user: newUser,
    supplier,
    token,
  });
});

// 3. Email & Password Login
const loginEmailSchema = z.object({
  email: z.string().email('Email manzili noto\'g\'ri formatda'),
  password: z.string().min(1, 'Parol kiritilishi shart'),
});

authRouter.post('/login-email', async (req: Request, res: Response): Promise<void> => {
  const result = loginEmailSchema.safeParse(req.body);

  if (!result.success) {
    const errorMsg = (result.error as any).issues?.[0]?.message || result.error.message || 'Email yoki parol kiritilmadi';
    res.status(400).json({ error: errorMsg });
    return;
  }

  const { email, password } = result.data;
  const user = db.findUserByEmail(email.trim().toLowerCase());

  if (!user) {
    res.status(401).json({ error: 'Ushbu email bilan ro\'yxatdan o\'tilgan hisob topilmadi' });
    return;
  }

  if (!user.password_hash) {
    res.status(400).json({
      error: 'Ushbu hisob Google yoki Telegram orqali ro\'yxatdan o\'tgan. Iltimos, tegishli usul bilan kiring.',
    });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    res.status(401).json({ error: 'Parol noto\'g\'ri kiritildi' });
    return;
  }

  const supplier = user.role === 'SUPPLIER' ? db.findSupplierByUserId(user.id) : undefined;
  const token = generateToken({
    userId: user.id,
    email: user.email,
    telegramId: user.telegram_id,
    role: user.role,
  });

  res.json({
    message: 'Tizimga muvaffaqiyatli kirildi',
    user,
    supplier,
    token,
  });
});

// 4. Google Sign-In & Sign-Up
authRouter.post('/google', async (req: Request, res: Response): Promise<void> => {
  const {
    google_id,
    email,
    first_name,
    last_name,
    avatar_url,
    role,
    phone_primary,
    company_name,
    delivery_fee,
    is_free_delivery,
  } = req.body;

  if (!email) {
    res.status(400).json({ error: 'Google email parametri majburiy' });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const gid = google_id || `google_${normalizedEmail}`;

  // Check if user already exists by google_id or email
  let user = db.findUserByGoogleId(gid) || db.findUserByEmail(normalizedEmail);

  if (user) {
    // If user didn't have google_id or avatar, link them
    if (!user.google_id || !user.avatar_url) {
      user = db.updateUser(user.id, {
        google_id: user.google_id || gid,
        avatar_url: user.avatar_url || avatar_url || null,
      });
    }

    const supplier = user?.role === 'SUPPLIER' ? db.findSupplierByUserId(user.id) : undefined;
    const token = generateToken({
      userId: user!.id,
      email: user!.email,
      telegramId: user!.telegram_id,
      role: user!.role,
    });

    res.json({
      isNewUser: false,
      user,
      supplier,
      token,
    });
    return;
  }

  // User does NOT exist yet.
  // If role is provided, create new account!
  if (role && (role === 'SUPPLIER' || role === 'RECEIVER')) {
    const newUser = db.createUser({
      telegram_id: null,
      email: normalizedEmail,
      password_hash: null,
      google_id: gid,
      avatar_url: avatar_url || null,
      role: role as Role,
      first_name: first_name?.trim() || 'Google Foydalanuvchi',
      last_name: last_name?.trim() || '',
      phone_primary: phone_primary?.trim() || '+998 90 000 00 00',
      phone_secondary: null,
      language: 'uz',
    });

    let supplier: any = undefined;
    if (newUser.role === 'SUPPLIER') {
      const cName = company_name?.trim() || `${newUser.first_name} Do'koni`;
      supplier = db.createSupplier({
        user_id: newUser.id,
        company_name: cName,
        delivery_fee: delivery_fee ? Number(delivery_fee) : 15000,
        is_free_delivery: is_free_delivery ?? false,
      });
    }

    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      telegramId: newUser.telegram_id,
      role: newUser.role,
    });

    res.status(201).json({
      isNewUser: false,
      user: newUser,
      supplier,
      token,
    });
    return;
  }

  // Role not provided: prompt frontend to let user choose role
  res.json({
    isNewUser: true,
    googleUser: {
      google_id: gid,
      email: normalizedEmail,
      first_name: first_name || '',
      last_name: last_name || '',
      avatar_url: avatar_url || null,
    },
  });
});

// 5. Telegram Role Registration (Existing)
const registerTelegramSchema = z.object({
  telegram_id: z.number().int().optional().nullable(),
  role: z.enum(['SUPPLIER', 'RECEIVER']),
  first_name: z.string().min(1, 'Ism kiritilishi shart'),
  last_name: z.string().min(1, 'Familiya kiritilishi shart'),
  phone_primary: z.string().min(7, 'Asosiy telefon raqami noto\'g\'ri'),
  phone_secondary: z.string().optional().nullable(),
  language: z.enum(['uz', 'ru', 'en']).default('uz'),
  company_name: z.string().optional(),
  delivery_fee: z.number().min(0).optional(),
  is_free_delivery: z.boolean().optional(),
});

authRouter.post('/register', (req: Request, res: Response): void => {
  const result = registerTelegramSchema.safeParse(req.body);

  if (!result.success) {
    const errorMsg = (result.error as any).issues?.[0]?.message || result.error.message || 'Ma\'lumotlar to\'liq emas';
    res.status(400).json({ error: errorMsg });
    return;
  }

  const data = result.data;

  // Check if user already exists
  let user = data.telegram_id ? db.findUserByTelegramId(data.telegram_id) : undefined;
  if (user) {
    user = db.updateUser(user.id, {
      role: data.role as Role,
      first_name: data.first_name,
      last_name: data.last_name,
      phone_primary: data.phone_primary,
      phone_secondary: data.phone_secondary || null,
      language: data.language,
    });
  } else {
    user = db.createUser({
      telegram_id: data.telegram_id ?? null,
      email: null,
      password_hash: null,
      google_id: null,
      avatar_url: null,
      role: data.role as Role,
      first_name: data.first_name,
      last_name: data.last_name,
      phone_primary: data.phone_primary,
      phone_secondary: data.phone_secondary || null,
      language: data.language,
    });
  }

  if (!user) {
    res.status(500).json({ error: 'Foydalanuvchini yaratishda xatolik yuz berdi' });
    return;
  }

  let supplier: any = undefined;
  if (user.role === 'SUPPLIER') {
    const existingSupplier = db.findSupplierByUserId(user.id);
    const companyName = data.company_name?.trim() || `${user.first_name} Yetkazib Berish`;
    const deliveryFee = data.delivery_fee ?? 15000;
    const isFree = data.is_free_delivery ?? false;

    if (existingSupplier) {
      supplier = db.updateSupplier(existingSupplier.id, {
        company_name: companyName,
        delivery_fee: deliveryFee,
        is_free_delivery: isFree,
      });
    } else {
      supplier = db.createSupplier({
        user_id: user.id,
        company_name: companyName,
        delivery_fee: deliveryFee,
        is_free_delivery: isFree,
      });
    }
  }

  const token = generateToken({
    userId: user.id,
    telegramId: user.telegram_id,
    email: user.email,
    role: user.role,
  });

  res.status(201).json({
    message: 'Ro\'yxatdan muvaffaqiyatli o\'tildi',
    user,
    supplier,
    token,
  });
});

// 6. Get Current User Profile
authRouter.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const user = db.findUserById(req.user!.userId);

  if (!user) {
    res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    return;
  }

  const supplier = user.role === 'SUPPLIER' ? db.findSupplierByUserId(user.id) : undefined;

  res.json({
    user,
    supplier,
  });
});

// 7. Update Profile
authRouter.put('/profile', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const { first_name, last_name, phone_primary, phone_secondary, language } = req.body;

  const updated = db.updateUser(req.user!.userId, {
    ...(first_name ? { first_name } : {}),
    ...(last_name ? { last_name } : {}),
    ...(phone_primary ? { phone_primary } : {}),
    ...(phone_secondary !== undefined ? { phone_secondary } : {}),
    ...(language ? { language } : {}),
  });

  if (!updated) {
    res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    return;
  }

  res.json({
    message: 'Profil yangilandi',
    user: updated,
  });
});

// 8. Dev Fast Login (For easy browser testing)
authRouter.post('/dev-login', (req: Request, res: Response): void => {
  if (!config.allowDevLogin) {
    res.status(403).json({ error: 'Dev login o\'chirilgan' });
    return;
  }

  const { role } = req.body; // 'SUPPLIER' | 'RECEIVER'
  const targetRole = role === 'SUPPLIER' ? 'SUPPLIER' : 'RECEIVER';

  // Look for any existing user with that role
  let existingUser = db.getAllSuppliers().map((s) => s.user).find((u) => u?.role === targetRole)
    || db.findUserById(targetRole === 'SUPPLIER' ? 'usr_sup_1' : 'usr_rec_1');

  // If no user exists, create a default demo one
  if (!existingUser) {
    existingUser = db.createUser({
      telegram_id: targetRole === 'SUPPLIER' ? 1001 : 2001,
      email: targetRole === 'SUPPLIER' ? 'supplier@bude.uz' : 'receiver@bude.uz',
      password_hash: null,
      google_id: null,
      avatar_url: null,
      role: targetRole,
      first_name: targetRole === 'SUPPLIER' ? 'Alisher' : 'Bobur',
      last_name: targetRole === 'SUPPLIER' ? 'Karimov' : 'Mirzayev',
      phone_primary: targetRole === 'SUPPLIER' ? '+998 90 123 45 67' : '+998 97 777 88 99',
      phone_secondary: null,
      language: 'uz',
    });

    if (targetRole === 'SUPPLIER') {
      db.createSupplier({
        user_id: existingUser.id,
        company_name: 'Buxoro Fresh Market & Logistics',
        delivery_fee: 15000,
        is_free_delivery: false,
      });
    }
  }

  const supplier = existingUser.role === 'SUPPLIER' ? db.findSupplierByUserId(existingUser.id) : undefined;
  const token = generateToken({
    userId: existingUser.id,
    telegramId: existingUser.telegram_id,
    email: existingUser.email,
    role: existingUser.role,
  });

  res.json({
    message: `Test rejimida kirildi (${targetRole})`,
    user: existingUser,
    supplier,
    token,
  });
});
