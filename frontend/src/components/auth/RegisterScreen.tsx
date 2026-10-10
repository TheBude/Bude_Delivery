import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { 
  Truck, ShoppingBag, Phone, PhoneCall, User as UserIcon, 
  Building2, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, AlertCircle 
} from 'lucide-react';
import { hapticImpact, hapticSelection, hapticNotification } from '../../utils/telegram';
import { LanguageButton, LanguageModal } from '../common/LanguageModal';

interface RegisterScreenProps {
  onSwitchToEmailAuth?: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onSwitchToEmailAuth }) => {
  const { t, i18n } = useTranslation();
  const { telegramUser, registerUser, isLoading } = useAuth();

  // Multi-step Wizard State: 1 | 2 | 3 | 4
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Role
  const [role, setRole] = useState<'SUPPLIER' | 'RECEIVER'>('RECEIVER');

  // Step 2: Name
  const [firstName, setFirstName] = useState(telegramUser?.first_name || '');
  const [lastName, setLastName] = useState(telegramUser?.last_name || '');

  // Step 3: Phone numbers (Primary mandatory, Secondary optional)
  const [phonePrimary, setPhonePrimary] = useState('+998 ');
  const [phoneSecondary, setPhoneSecondary] = useState('');

  // Step 4: Organization name & Delivery settings
  const [companyName, setCompanyName] = useState('');
  const [deliveryFee, setDeliveryFee] = useState<number>(15000);
  const [isFreeDelivery, setIsFreeDelivery] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [isLangModalOpen, setIsLangModalOpen] = useState<boolean>(false);

  const handleRoleSelect = (selectedRole: 'SUPPLIER' | 'RECEIVER') => {
    hapticSelection();
    setRole(selectedRole);
  };

  const goToNextStep = () => {
    setError(null);

    if (step === 1) {
      hapticImpact('light');
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!firstName.trim()) {
        hapticNotification('error');
        setError('Iltimos, ismingizni kiriting');
        return;
      }
      if (!lastName.trim()) {
        hapticNotification('error');
        setError('Iltimos, familiyangizni kiriting');
        return;
      }
      hapticImpact('light');
      setStep(3);
      return;
    }

    if (step === 3) {
      const cleanPhone = phonePrimary.replace(/\D/g, '');
      if (!phonePrimary.trim() || cleanPhone.length < 9) {
        hapticNotification('error');
        setError('1-raqamni to‘liq kiriting (kamida 9 ta raqam, masalan: +998 90 123 45 67)');
        return;
      }
      hapticImpact('light');
      setStep(4);
      return;
    }
  };

  const goToPreviousStep = () => {
    hapticImpact('light');
    setError(null);
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleFinalSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    hapticImpact('heavy');
    setError(null);

    if (!companyName.trim()) {
      hapticNotification('error');
      setError('Tashkilot yoki do‘kon rasmiy nomi kiritilishi shart');
      return;
    }

    try {
      await registerUser({
        telegram_id: telegramUser?.id || Math.floor(100000 + Math.random() * 900000),
        role,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_primary: phonePrimary.trim(),
        phone_secondary: phoneSecondary.trim() || null,
        language: i18n.language || 'uz',
        company_name: companyName.trim(),
        delivery_fee: Number(deliveryFee),
        is_free_delivery: isFreeDelivery,
      });
    } catch (err: any) {
      setError(err.message || 'Ro‘yxatdan o‘tishda xatolik yuz berdi');
    }
  };

  // Step information
  const stepTitles: Record<number, { title: string; subtitle: string }> = {
    1: {
      title: 'Faoliyat turini tanlang',
      subtitle: 'Siz Dillermisiz yoki Qabul qiluvchi do‘kon?',
    },
    2: {
      title: 'Ism va familiyangiz',
      subtitle: 'Shaxsiy ma‘lumotlaringizni kiriting',
    },
    3: {
      title: 'Bog‘lanish telefonlari',
      subtitle: '1-raqam majburiy, 2-raqam ixtiyoriy',
    },
    4: {
      title: 'Tashkilot rasmiy nomi',
      subtitle: role === 'SUPPLIER' ? 'Dillerlik korxonangiz rasmiy nomi' : 'Do‘koningiz yoki savdo nuqtangiz nomi',
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/70 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-between px-4 py-6 font-sans">
      <div className="max-w-md w-full mx-auto space-y-4">
        {/* Top Header & Logo */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                {t('app_name')}
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Ro‘yxatdan o‘tish
              </p>
            </div>
          </div>

          {/* Modern Language Button */}
          <LanguageButton onClick={() => setIsLangModalOpen(true)} />
        </div>

        {/* Step Progress Bar */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>Qadam {step} / 4</span>
            <span className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold">
              {Math.round((step / 4) * 100)}% yakunlandi
            </span>
          </div>

          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-500 to-teal-500 rounded-full"
              initial={{ width: '25%' }}
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>

          <div className="grid grid-cols-4 gap-1.5 pt-1 text-[10px] text-center font-medium">
            <span className={step >= 1 ? 'text-brand-600 font-bold' : 'text-slate-400'}>1. Rol</span>
            <span className={step >= 2 ? 'text-brand-600 font-bold' : 'text-slate-400'}>2. Ism</span>
            <span className={step >= 3 ? 'text-brand-600 font-bold' : 'text-slate-400'}>3. Telefon</span>
            <span className={step >= 4 ? 'text-brand-600 font-bold' : 'text-slate-400'}>4. Tashkilot</span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center gap-2 shadow-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Step Content Container */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-5 shadow-xl border border-slate-200/80 dark:border-slate-800/80 min-h-[300px] flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                {stepTitles[step].title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {stepTitles[step].subtitle}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {/* STEP 1: Rolni tanlash (Diller mi yoki Qabul qiluvchi dukonmi) */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('SUPPLIER')}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3.5 ${
                      role === 'SUPPLIER'
                        ? 'border-brand-600 bg-brand-50/70 dark:bg-brand-950/40 shadow-md ring-2 ring-brand-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                    }`}
                  >
                    <div className={`p-3 rounded-2xl ${
                      role === 'SUPPLIER'
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}>
                      <Truck className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          🚚 Diller (Yetkazib beruvchi)
                        </h3>
                        {role === 'SUPPLIER' && (
                          <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Mahsulotlarni ulgurji narxda sotish, katalog yaratish va buyurtmalarni do‘konlarga yetkazib berish.
                      </p>
                      <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        Ulgurji Ta‘minotchi
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSelect('RECEIVER')}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3.5 ${
                      role === 'RECEIVER'
                        ? 'border-brand-600 bg-brand-50/70 dark:bg-brand-950/40 shadow-md ring-2 ring-brand-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                    }`}
                  >
                    <div className={`p-3 rounded-2xl ${
                      role === 'RECEIVER'
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}>
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          🏪 Qabul qiluvchi do‘kon (Do‘kon / Haridor)
                        </h3>
                        {role === 'RECEIVER' && (
                          <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Do‘koningiz yoki savdo nuqtangiz uchun dillerlardan tovar tanlash va manzilga buyurtma berish.
                      </p>
                      <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        Chakana Savdo Do‘koni
                      </span>
                    </div>
                  </button>
                </motion.div>
              )}

              {/* STEP 2: Ism va Familiya */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3.5"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Ismingiz *
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        autoFocus
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Masalan: Sardor"
                        className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Familiyangiz *
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Masalan: Alimov"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  {telegramUser?.id && (
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Telegram hisobingizdan avtomatik to‘ldirildi
                    </p>
                  )}
                </motion.div>
              )}

              {/* STEP 3: Telefon raqamlar (1-raqam majburiy, 2-raqam ixtiyoriy) */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3.5"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        1-raqam (Asosiy telefon) *
                      </label>
                      <span className="text-[10px] text-rose-500 font-semibold">Majburiy</span>
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 w-4 h-4 text-brand-600" />
                      <input
                        type="tel"
                        required
                        autoFocus
                        value={phonePrimary}
                        onChange={(e) => setPhonePrimary(e.target.value)}
                        placeholder="+998 90 123 45 67"
                        className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Buyurtmalar va asosiy bildirishnomalar ushbu raqamga bog‘lanadi
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        2-raqam (Qo‘shimcha telefon)
                      </label>
                      <span className="text-[10px] text-slate-400 font-medium">Ixtiyoriy</span>
                    </div>
                    <div className="relative">
                      <PhoneCall className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        value={phoneSecondary}
                        onChange={(e) => setPhoneSecondary(e.target.value)}
                        placeholder="+998 99 987 65 43"
                        className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      1-raqamingiz o‘chiq bo‘lganda yoki aloqa bo‘lmaganda zaxira aloqa uchun
                    </p>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Tashkilot rasmiy nomi */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3.5"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {role === 'SUPPLIER'
                        ? 'Dillerlik korxonasi rasmiy nomi *'
                        : 'Do‘kon yoki Savdo nuqtasi rasmiy nomi *'}
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-3 w-4 h-4 text-brand-600" />
                      <input
                        type="text"
                        required
                        autoFocus
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder={
                          role === 'SUPPLIER'
                            ? 'Masalan: Buxoro Agro Savdo MCHJ'
                            : 'Masalan: Fayz Oziq-ovqat Do‘koni'
                        }
                        className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {role === 'SUPPLIER'
                        ? 'Buyurtmachilar tovarlarni aynan shu diller nomi ostida ko‘rishadi'
                        : 'Dillerlar buyurtmalarni sizning ushbu do‘koningiz nomiga jo‘natishadi'}
                    </p>
                  </div>

                  {/* Supplier extra delivery fields */}
                  {role === 'SUPPLIER' && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Standart yetkazish to‘lovi
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-emerald-600">
                          <input
                            type="checkbox"
                            checked={isFreeDelivery}
                            onChange={(e) => setIsFreeDelivery(e.target.checked)}
                            className="w-4 h-4 rounded text-brand-600 border-slate-300"
                          />
                          <span>Tekin yetkazish</span>
                        </label>
                      </div>

                      {!isFreeDelivery && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={deliveryFee}
                            onChange={(e) => setDeliveryFee(Number(e.target.value))}
                            className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                          />
                          <span className="text-xs text-slate-500 font-medium">so‘m</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-800 dark:text-amber-200 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Barcha ma‘lumotlar to‘liq tayyor!
                    </p>
                    <p className="opacity-90">
                      "Yakunlash" tugmasini bosib darhol tizimdan foydalanishni boshlashingiz mumkin.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Buttons (Back & Next / Submit) */}
          <div className="pt-5 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={goToPreviousStep}
                className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Orqaga</span>
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={goToNextStep}
                className="flex-1 py-3 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 transition-all"
              >
                <span>Davom etish</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleFinalSubmit()}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-700 hover:to-teal-700 active:scale-[0.98] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-brand-500/30 disabled:opacity-50 transition-all"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Yuklanmoqda...
                  </span>
                ) : (
                  <>
                    <span>Ro‘yxatdan o‘tishni yakunlash</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Switch to Email Login if needed */}
        {onSwitchToEmailAuth && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onSwitchToEmailAuth}
              className="text-xs font-semibold text-slate-500 hover:text-brand-600 transition"
            >
              Allaqachon hisobingiz bormi? <span className="text-brand-600 font-bold underline">Email orqali kirish</span>
            </button>
          </div>
        )}
      </div>

      <p className="text-center text-[10px] text-slate-400 py-2">
        © Bude Delivery Platform • Ishonchli va xavfsiz yetkazib berish
      </p>

      {/* Language Selection Modal */}
      <LanguageModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
      />
    </div>
  );
};
