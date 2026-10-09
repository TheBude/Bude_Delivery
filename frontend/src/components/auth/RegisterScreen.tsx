import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { changeLanguage } from '../../i18n';
import { Truck, ShoppingBag, Phone, User as UserIcon, Building2, CheckCircle2, ArrowRight } from 'lucide-react';
import { hapticImpact, hapticSelection } from '../../utils/telegram';

export const RegisterScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { telegramUser, registerUser, loginWithDevRole, isLoading } = useAuth();

  const [role, setRole] = useState<'SUPPLIER' | 'RECEIVER'>('RECEIVER');
  const [firstName, setFirstName] = useState(telegramUser?.first_name || '');
  const [lastName, setLastName] = useState(telegramUser?.last_name || '');
  const [phonePrimary, setPhonePrimary] = useState('+998 ');
  const [phoneSecondary, setPhoneSecondary] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [deliveryFee, setDeliveryFee] = useState<number>(15000);
  const [isFreeDelivery, setIsFreeDelivery] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleSelect = (selectedRole: 'SUPPLIER' | 'RECEIVER') => {
    hapticSelection();
    setRole(selectedRole);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    hapticImpact('medium');
    setError(null);

    if (!firstName.trim()) {
      setError(t('auth.first_name') + ' kiritilishi shart');
      return;
    }
    if (!lastName.trim()) {
      setError(t('auth.last_name') + ' kiritilishi shart');
      return;
    }
    if (!phonePrimary.trim() || phonePrimary.replace(/\D/g, '').length < 9) {
      setError('Asosiy telefon raqamini to\'liq kiriting (+998...)');
      return;
    }
    if (role === 'SUPPLIER' && !companyName.trim()) {
      setError('Kompaniya yoki Do\'kon nomi kiritilishi shart');
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
        language: i18n.language,
        company_name: companyName.trim(),
        delivery_fee: Number(deliveryFee),
        is_free_delivery: isFreeDelivery,
      });
    } catch (err: any) {
      setError(err.message || 'Ro\'yxatdan o\'tishda xatolik');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/60 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-center px-4 py-8">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* App Logo & Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-500 text-white shadow-xl shadow-brand-500/25">
            <Truck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('app_name')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            {t('tagline')}
          </p>
        </motion.div>

        {/* Language Switcher Bar */}
        <div className="flex items-center justify-center gap-2 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 w-fit mx-auto shadow-sm">
          {(['uz', 'ru', 'en'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => {
                hapticSelection();
                changeLanguage(lang);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                i18n.language === lang
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-brand-600'
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-slate-200/80 dark:border-slate-800/80 space-y-5"
        >
          {error && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Mandatory Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                {t('auth.select_role_prompt')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleRoleSelect('RECEIVER')}
                  className={`relative p-3.5 rounded-xl border-2 text-left transition flex flex-col justify-between ${
                    role === 'RECEIVER'
                      ? 'border-brand-600 bg-brand-50/70 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <ShoppingBag className={`w-5 h-5 ${role === 'RECEIVER' ? 'text-brand-600' : 'text-slate-400'}`} />
                    {role === 'RECEIVER' && <CheckCircle2 className="w-4 h-4 text-brand-600" />}
                  </div>
                  <div>
                    <span className="block font-bold text-xs">{t('roles.receiver')}</span>
                    <span className="text-[10px] opacity-75 leading-tight line-clamp-2">
                      {t('roles.receiver_desc')}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect('SUPPLIER')}
                  className={`relative p-3.5 rounded-xl border-2 text-left transition flex flex-col justify-between ${
                    role === 'SUPPLIER'
                      ? 'border-brand-600 bg-brand-50/70 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <Truck className={`w-5 h-5 ${role === 'SUPPLIER' ? 'text-brand-600' : 'text-slate-400'}`} />
                    {role === 'SUPPLIER' && <CheckCircle2 className="w-4 h-4 text-brand-600" />}
                  </div>
                  <div>
                    <span className="block font-bold text-xs">{t('roles.supplier')}</span>
                    <span className="text-[10px] opacity-75 leading-tight line-clamp-2">
                      {t('roles.supplier_desc')}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Personal Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t('auth.first_name')} *
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={t('auth.first_name_placeholder')}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t('auth.last_name')} *
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t('auth.last_name_placeholder')}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* 3. Phone Numbers */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {t('auth.phone_primary')} *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={phonePrimary}
                  onChange={(e) => setPhonePrimary(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {t('auth.phone_secondary')}
              </label>
              <input
                type="tel"
                value={phoneSecondary}
                onChange={(e) => setPhoneSecondary(e.target.value)}
                placeholder="+998 99 987 65 43"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* 4. Supplier Specific fields */}
            {role === 'SUPPLIER' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {t('auth.company_name')} *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder={t('auth.company_placeholder')}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {t('auth.default_delivery_fee')}
                    </label>
                    <input
                      type="number"
                      disabled={isFreeDelivery}
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-40"
                    />
                  </div>

                  <div className="pt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isFreeDelivery}
                        onChange={(e) => setIsFreeDelivery(e.target.checked)}
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700"
                      />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {t('auth.free_delivery')}
                      </span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-500 hover:to-teal-500 shadow-lg shadow-brand-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              <span>{t('auth.register_btn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Dev-Login Links for one-click browser evaluation */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              {t('auth.dev_mode_title')}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => loginWithDevRole('SUPPLIER')}
                className="py-2 px-2.5 rounded-lg text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition"
              >
                📦 {t('auth.dev_login_supplier')}
              </button>
              <button
                type="button"
                onClick={() => loginWithDevRole('RECEIVER')}
                className="py-2 px-2.5 rounded-lg text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 border border-teal-200 dark:border-teal-800 transition"
              >
                🛒 {t('auth.dev_login_receiver')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
