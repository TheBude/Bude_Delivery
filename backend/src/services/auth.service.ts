import bcrypt from 'bcryptjs';
import { db } from '../db/storage';
import { config } from '../config';
import { generateToken } from '../utils/jwt';
import { validateTelegramInitData } from '../utils/telegramAuth';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../errors/AppError';
import {
  GoogleAuthInput,
  RegisterEmailInput,
  RegisterTelegramInput,
  UpdateProfileInput,
} from '../validators/auth.validator';
import { Role, User, Supplier } from '../types';
import { ROLES } from '../constants/app.constants';

export class AuthService {
  /**
   * Validate Telegram WebApp initData string
   */
  public async validateTelegram(initData: string) {
    if (!initData) {
      throw new BadRequestError('initData majburiy parametr');
    }

    const validation = validateTelegramInitData(initData, config.telegramBotToken);

    let telegramId: number;
    let firstName: string;
    let lastName: string;

    if (validation.isValid && validation.data?.user) {
      telegramId = validation.data.user.id;
      firstName = validation.data.user.first_name;
      lastName = validation.data.user.last_name || '';
    } else {
      // In dev mode, permit testing with parsed unverified data
      if (config.allowDevLogin) {
        try {
          const urlParams = new URLSearchParams(initData);
          const userJson = urlParams.get('user');
          if (userJson) {
            const parsed = JSON.parse(userJson);
            telegramId = parsed.id;
            firstName = parsed.first_name;
            lastName = parsed.last_name || '';
          } else {
            throw new UnauthorizedError(
              `Telegram initData tekshiruvdan o'tmadi: ${validation.error || 'Noma\'lum xato'}`
            );
          }
        } catch {
          throw new UnauthorizedError('Telegram initData formati noto\'g\'ri');
        }
      } else {
        throw new UnauthorizedError(
          `Telegram initData tekshiruvdan o'tmadi: ${validation.error || 'Noma\'lum xato'}`
        );
      }
    }

    let user = db.findUserByTelegramId(telegramId);
    const isOwnerAdmin = String(telegramId) === '8012592174';

    if (!user) {
      // Auto-register Telegram user seamlessly
      user = db.createUser({
        telegram_id: telegramId,
        email: null,
        password_hash: null,
        google_id: null,
        avatar_url: validation.data?.user?.photo_url || null,
        role: isOwnerAdmin ? 'ADMIN' : ROLES.RECEIVER,
        first_name: firstName || 'Foydalanuvchi',
        last_name: lastName || '',
        phone_primary: '',
        phone_secondary: null,
        language: validation.data?.user?.language_code || 'uz',
      });
      console.log(`🎉 [Telegram] Yangi foydalanuvchi avtomatik ro'yxatdan o'tkazildi: ${user.first_name} ${user.last_name} (Telegram ID: ${user.telegram_id}) - Role: ${user.role}`);
    } else if (isOwnerAdmin && user.role !== 'ADMIN') {
      // Elevate existing user to ADMIN
      user = db.updateUser(user.id, { role: 'ADMIN' }) || user;
      console.log(`👑 [Telegram] Foydalanuvchi ADMIN darajasiga ko‘tarildi: (Telegram ID: ${user.telegram_id})`);
    }

    const supplier =
      user.role === ROLES.SUPPLIER ? db.findSupplierByUserId(user.id) : undefined;
    const token = generateToken({
      userId: user.id,
      telegramId: user.telegram_id,
      email: user.email,
      role: user.role,
    });

    return {
      isNewUser: false,
      user,
      supplier,
      token,
    };
  }

  /**
   * Register with Email & Password
   */
  public async registerEmail(input: RegisterEmailInput) {
    const normalizedEmail = input.email.trim().toLowerCase();
    const existingUser = db.findUserByEmail(normalizedEmail);

    if (existingUser) {
      throw new ConflictError(
        'Ushbu email bilan allaqachon ro\'yxatdan o\'tilgan. Kirish sahifasidan foydalaning.'
      );
    }

    const passwordHash = await bcrypt.hash(input.password, config.bcryptSaltRounds);

    const newUser = db.createUser({
      telegram_id: null,
      email: normalizedEmail,
      password_hash: passwordHash,
      google_id: null,
      avatar_url: null,
      role: input.role,
      first_name: input.first_name.trim(),
      last_name: input.last_name.trim(),
      phone_primary: input.phone_primary.trim(),
      phone_secondary: input.phone_secondary?.trim() || null,
      language: input.language,
    });

    let supplier: Supplier | undefined;
    if (newUser.role === ROLES.SUPPLIER) {
      const companyName = input.company_name?.trim() || `${newUser.first_name} Yetkazib Berish`;
      supplier = db.createSupplier({
        user_id: newUser.id,
        company_name: companyName,
        delivery_fee: input.delivery_fee ?? config.defaultDeliveryFee,
        is_free_delivery: input.is_free_delivery ?? false,
      });
    }

    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      telegramId: newUser.telegram_id,
      role: newUser.role,
    });

    return {
      message: 'Ro\'yxatdan muvaffaqiyatli o\'tildi',
      user: newUser,
      supplier,
      token,
    };
  }

  /**
   * Log in with Email & Password
   */
  public async loginEmail(emailInput: string, passwordInput: string) {
    const normalizedEmail = emailInput.trim().toLowerCase();
    const user = db.findUserByEmail(normalizedEmail);

    if (!user) {
      throw new UnauthorizedError('Ushbu email bilan ro\'yxatdan o\'tilgan hisob topilmadi');
    }

    if (!user.password_hash) {
      throw new BadRequestError(
        'Ushbu hisob Google yoki Telegram orqali ro\'yxatdan o\'tgan. Iltimos, tegishli usul bilan kiring.'
      );
    }

    const isPasswordValid = await bcrypt.compare(passwordInput, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Parol noto\'g\'ri kiritildi');
    }

    const supplier = user.role === ROLES.SUPPLIER ? db.findSupplierByUserId(user.id) : undefined;
    const token = generateToken({
      userId: user.id,
      email: user.email,
      telegramId: user.telegram_id,
      role: user.role,
    });

    return {
      message: 'Tizimga muvaffaqiyatli kirildi',
      user,
      supplier,
      token,
    };
  }

  /**
   * Google Sign-in / Sign-up
   */
  public async googleAuth(input: GoogleAuthInput) {
    const normalizedEmail = input.email.trim().toLowerCase();
    const gid = input.google_id || `google_${normalizedEmail}`;

    let user = db.findUserByGoogleId(gid) || db.findUserByEmail(normalizedEmail);

    if (user) {
      if (!user.google_id || !user.avatar_url) {
        user = db.updateUser(user.id, {
          google_id: user.google_id || gid,
          avatar_url: user.avatar_url || input.avatar_url || null,
        });
      }

      const supplier = user?.role === ROLES.SUPPLIER ? db.findSupplierByUserId(user.id) : undefined;
      const token = generateToken({
        userId: user!.id,
        email: user!.email,
        telegramId: user!.telegram_id,
        role: user!.role,
      });

      return {
        isNewUser: false,
        user,
        supplier,
        token,
      };
    }

    // Role provided: create new account immediately
    if (input.role) {
      const newUser = db.createUser({
        telegram_id: null,
        email: normalizedEmail,
        password_hash: null,
        google_id: gid,
        avatar_url: input.avatar_url || null,
        role: input.role,
        first_name: input.first_name?.trim() || 'Google Foydalanuvchi',
        last_name: input.last_name?.trim() || '',
        phone_primary: input.phone_primary?.trim() || '+998 90 000 00 00',
        phone_secondary: null,
        language: 'uz',
      });

      let supplier: Supplier | undefined;
      if (newUser.role === ROLES.SUPPLIER) {
        const cName = input.company_name?.trim() || `${newUser.first_name} Do'koni`;
        supplier = db.createSupplier({
          user_id: newUser.id,
          company_name: cName,
          delivery_fee: input.delivery_fee ? Number(input.delivery_fee) : config.defaultDeliveryFee,
          is_free_delivery: input.is_free_delivery ?? false,
        });
      }

      const token = generateToken({
        userId: newUser.id,
        email: newUser.email,
        telegramId: newUser.telegram_id,
        role: newUser.role,
      });

      return {
        isNewUser: false,
        user: newUser,
        supplier,
        token,
      };
    }

    // Role not provided: request role from frontend
    return {
      isNewUser: true,
      googleUser: {
        google_id: gid,
        email: normalizedEmail,
        first_name: input.first_name || '',
        last_name: input.last_name || '',
        avatar_url: input.avatar_url || null,
      },
    };
  }

  /**
   * Register with Telegram info
   */
  public async registerTelegram(input: RegisterTelegramInput) {
    let user = input.telegram_id ? db.findUserByTelegramId(input.telegram_id) : undefined;

    if (user) {
      user = db.updateUser(user.id, {
        role: input.role,
        first_name: input.first_name,
        last_name: input.last_name,
        phone_primary: input.phone_primary,
        phone_secondary: input.phone_secondary || null,
        language: input.language,
      });
    } else {
      user = db.createUser({
        telegram_id: input.telegram_id ?? null,
        email: null,
        password_hash: null,
        google_id: null,
        avatar_url: null,
        role: input.role,
        first_name: input.first_name,
        last_name: input.last_name,
        phone_primary: input.phone_primary,
        phone_secondary: input.phone_secondary || null,
        language: input.language,
      });
    }

    if (!user) {
      throw new BadRequestError('Foydalanuvchini yaratishda xatolik yuz berdi');
    }

    let supplier: Supplier | undefined;
    if (user.role === ROLES.SUPPLIER) {
      const existingSupplier = db.findSupplierByUserId(user.id);
      const companyName = input.company_name?.trim() || `${user.first_name} Yetkazib Berish`;
      const deliveryFee = input.delivery_fee ?? config.defaultDeliveryFee;
      const isFree = input.is_free_delivery ?? false;

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

    return {
      message: 'Ro\'yxatdan muvaffaqiyatli o\'tildi',
      user,
      supplier,
      token,
    };
  }

  /**
   * Get user profile by userId
   */
  public async getProfile(userId: string) {
    const user = db.findUserById(userId);
    if (!user) {
      throw new NotFoundError('Foydalanuvchi topilmadi');
    }

    const supplier = user.role === ROLES.SUPPLIER ? db.findSupplierByUserId(user.id) : undefined;
    return { user, supplier };
  }

  /**
   * Update profile
   */
  public async updateProfile(userId: string, input: UpdateProfileInput) {
    const updated = db.updateUser(userId, {
      ...(input.first_name ? { first_name: input.first_name } : {}),
      ...(input.last_name ? { last_name: input.last_name } : {}),
      ...(input.phone_primary ? { phone_primary: input.phone_primary } : {}),
      ...(input.phone_secondary !== undefined ? { phone_secondary: input.phone_secondary } : {}),
      ...(input.language ? { language: input.language } : {}),
    });

    if (!updated) {
      throw new NotFoundError('Foydalanuvchi topilmadi');
    }

    return {
      message: 'Profil yangilandi',
      user: updated,
    };
  }

  /**
   * Dev fast login for testing
   */
  public async devLogin(roleParam?: Role) {
    if (!config.allowDevLogin) {
      throw new ForbiddenError('Dev login o\'chirilgan');
    }

    const targetRole: Role = roleParam === ROLES.SUPPLIER ? ROLES.SUPPLIER : ROLES.RECEIVER;

    let existingUser =
      db.getAllSuppliers().map((s) => s.user).find((u) => u?.role === targetRole) ||
      db.findUserById(targetRole === ROLES.SUPPLIER ? 'usr_sup_1' : 'usr_rec_1');

    if (!existingUser) {
      existingUser = db.createUser({
        telegram_id: targetRole === ROLES.SUPPLIER ? 1001 : 2001,
        email: targetRole === ROLES.SUPPLIER ? 'supplier@bude.uz' : 'receiver@bude.uz',
        password_hash: null,
        google_id: null,
        avatar_url: null,
        role: targetRole,
        first_name: targetRole === ROLES.SUPPLIER ? 'Alisher' : 'Bobur',
        last_name: targetRole === ROLES.SUPPLIER ? 'Karimov' : 'Mirzayev',
        phone_primary: targetRole === ROLES.SUPPLIER ? '+998 90 123 45 67' : '+998 97 777 88 99',
        phone_secondary: null,
        language: 'uz',
      });

      if (targetRole === ROLES.SUPPLIER) {
        db.createSupplier({
          user_id: existingUser.id,
          company_name: 'Buxoro Fresh Market & Logistics',
          delivery_fee: config.defaultDeliveryFee,
          is_free_delivery: false,
        });
      }
    }

    const supplier =
      existingUser.role === ROLES.SUPPLIER ? db.findSupplierByUserId(existingUser.id) : undefined;
    const token = generateToken({
      userId: existingUser.id,
      telegramId: existingUser.telegram_id,
      email: existingUser.email,
      role: existingUser.role,
    });

    return {
      message: `Test rejimida kirildi (${targetRole})`,
      user: existingUser,
      supplier,
      token,
    };
  }
}

export const authService = new AuthService();
