import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { changeLanguage } from '../../i18n';
import { 
  Truck, ShoppingBag, User as UserIcon, 
  CheckCircle2, ArrowRight, Mail, Lock, Eye, EyeOff, 
  AlertCircle, X 
} from 'lucide-react';
import { hapticImpact, hapticSelection } from '../../utils/telegram';

// Google SVG 4-color Logo
const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const AuthScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { loginWithEmail, registerWithEmail, loginWithGoogle, loginWithDevRole, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Common Fields
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Register Fields
  const [role, setRole] = useState<'SUPPLIER' | 'RECEIVER'>('RECEIVER');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [phonePrimary, setPhonePrimary] = useState<string>('+998 ');
  const [phoneSecondary, setPhoneSecondary] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [deliveryFee, setDeliveryFee] = useState<number>(15000);
  const [isFreeDelivery, setIsFreeDelivery] = useState<boolean>(false);

  // Google Modal State (when new Google user needs to pick role)
  const [pendingGoogleUser, setPendingGoogleUser] = useState<any | null>(null);
  const [googleRole, setGoogleRole] = useState<'SUPPLIER' | 'RECEIVER'>('RECEIVER');
  const [googlePhone, setGooglePhone] = useState<string>('+998 ');
  const [googleCompanyName, setGoogleCompanyName] = useState<string>('');

  // Interactive Google Prompt Simulation Modal
  const [isGooglePromptOpen, setIsGooglePromptOpen] = useState<boolean>(false);
  const [googleInputEmail, setGoogleInputEmail] = useState<string>('foydalanuvchi@gmail.com');
  const [googleInputName, setGoogleInputName] = useState<string>('Sardor Alimov');

  const [error, setError] = useState<string | null>(null);

  const handleTabSwitch = (tab: 'LOGIN' | 'REGISTER') => {
    hapticSelection();
    setError(null);
    setActiveTab(tab);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    hapticImpact('medium');
    setError(null);

    if (!email.trim() || !password) {
      setError('Email va parolni kiriting');
      return;
    }

    try {
      await loginWithEmail({
        email: email.trim(),
        password,
      });
    } catch (err: any) {
      setError(err.message || 'Kirishda xatolik yuz berdi');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    hapticImpact('heavy');
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError('Ism va Familiyangizni kiriting');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('To\'g\'ri email manzilini kiriting');
      return;
    }
    if (password.length < 6) {
      setError('Parol kamida 6 ta belgidan iborat bo\'lishi shart');
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
      await registerWithEmail({
        email: email.trim(),
        password,
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
      setError(err.message || 'Ro\'yxatdan o\'tishda xatolik yuz berdi');
    }
  };

  // Google Login Trigger
  const handleOpenGooglePrompt = () => {
    hapticImpact('light');
    setIsGooglePromptOpen(true);
  };

  const handleExecuteGoogleAuth = async (emailAddr: string, fullName: string) => {
    setIsGooglePromptOpen(false);
    hapticImpact('medium');
    setError(null);

    const names = fullName.trim().split(' ');
    const fName = names[0] || 'Google';
    const lName = names.slice(1).join(' ') || 'Foydalanuvchi';

    try {
      const res = await loginWithGoogle({
        email: emailAddr.trim(),
        first_name: fName,
        last_name: lName,
        google_id: `google_${emailAddr.trim().toLowerCase()}`,
      });

      if (res?.isNewUser) {
        setPendingGoogleUser({
          email: emailAddr.trim(),
          first_name: fName,
          last_name: lName,
          google_id: `google_${emailAddr.trim().toLowerCase()}`,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Google orqali kirishda xatolik');
    }
  };

  const handleFinishGoogleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    hapticImpact('heavy');
    if (!pendingGoogleUser) return;

    try {
      await loginWithGoogle({
        ...pendingGoogleUser,
        role: googleRole,
        phone_primary: googlePhone.trim(),
        company_name: googleCompanyName.trim(),
      });
      setPendingGoogleUser(null);
    } catch (err: any) {
      setError(err.message || 'Google ro\'yxatdan o\'tishda xatolik');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/60 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-center px-4 py-8">
      <div className="max-w-md w-full mx-auto space-y-5">
        {/* App Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-1.5"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-500 text-white shadow-xl shadow-brand-500/25">
            <Truck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('app_name')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('tagline')}
          </p>
        </motion.div>

        {/* Language Switcher Bar */}
        <div className="flex items-center justify-center gap-1.5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 w-fit mx-auto shadow-xs">
          {(['uz', 'ru', 'en'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => {
                hapticSelection();
                changeLanguage(lang);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                i18n.language === lang
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-brand-600'
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-slate-200/80 dark:border-slate-800/80 space-y-5"
        >
          {/* Dual Tab Switcher: KIRISH vs RO'YXATDAN O'TISH */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleTabSwitch('LOGIN')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition relative ${
                activeTab === 'LOGIN'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('auth.login_tab')}
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('REGISTER')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition relative ${
                activeTab === 'REGISTER'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('auth.register_tab')}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-xl flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* 1. Google One-Click Button */}
          <div>
            <button
              type="button"
              onClick={handleOpenGooglePrompt}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2.5 shadow-xs active:scale-[0.98] transition"
            >
              <GoogleIcon />
              <span>{activeTab === 'LOGIN' ? t('auth.google_login') : t('auth.google_register')}</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-slate-900 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider relative shrink-0">
              {t('auth.or_divider')}
            </span>
          </div>

          {/* TAB 1: LOGIN FORM */}
          {activeTab === 'LOGIN' && (
            <motion.form
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleLoginSubmit}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t('auth.email')} *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.email_placeholder')}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t('auth.password')} *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.password_placeholder')}
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-500 hover:to-teal-500 shadow-lg shadow-brand-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                <span>{isLoading ? 'Yuklanmoqda...' : t('auth.login_btn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-1">
                <span className="text-[11px] text-slate-500">
                  {t('auth.no_account_prompt')}{' '}
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('REGISTER')}
                    className="font-bold text-brand-600 dark:text-brand-400 hover:underline ml-1"
                  >
                    {t('auth.switch_to_register')}
                  </button>
                </span>
              </div>
            </motion.form>
          )}

          {/* TAB 2: REGISTER FORM */}
          {activeTab === 'REGISTER' && (
            <motion.form
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleRegisterSubmit}
              className="space-y-4"
            >
              {/* Mandatory Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                  {t('auth.select_role_prompt')}
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      hapticSelection();
                      setRole('RECEIVER');
                    }}
                    className={`p-3 rounded-xl border-2 text-left transition flex flex-col justify-between ${
                      role === 'RECEIVER'
                        ? 'border-brand-600 bg-brand-50/70 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <ShoppingBag className={`w-4 h-4 ${role === 'RECEIVER' ? 'text-brand-600' : 'text-slate-400'}`} />
                      {role === 'RECEIVER' && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />}
                    </div>
                    <span className="font-bold text-xs">{t('roles.receiver')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      hapticSelection();
                      setRole('SUPPLIER');
                    }}
                    className={`p-3 rounded-xl border-2 text-left transition flex flex-col justify-between ${
                      role === 'SUPPLIER'
                        ? 'border-brand-600 bg-brand-50/70 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <Truck className={`w-4 h-4 ${role === 'SUPPLIER' ? 'text-brand-600' : 'text-slate-400'}`} />
                      {role === 'SUPPLIER' && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />}
                    </div>
                    <span className="font-bold text-xs">{t('roles.supplier')}</span>
                  </button>
                </div>
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-2 gap-2.5">
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

              {/* Email & Password */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t('auth.email')} *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.email_placeholder')}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t('auth.password')} *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.password_placeholder')}
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Phone Numbers */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {t('auth.phone_primary')} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phonePrimary}
                    onChange={(e) => setPhonePrimary(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {t('auth.phone_secondary')}
                  </label>
                  <input
                    type="tel"
                    value={phoneSecondary}
                    onChange={(e) => setPhoneSecondary(e.target.value)}
                    placeholder="+998 99..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Supplier Specific fields */}
              {role === 'SUPPLIER' && (
                <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {t('auth.company_name')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder={t('auth.company_placeholder')}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 items-center">
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

                    <div className="pt-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isFreeDelivery}
                          onChange={(e) => setIsFreeDelivery(e.target.checked)}
                          className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                        />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {t('auth.free_delivery')}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-500 hover:to-teal-500 shadow-lg shadow-brand-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                <span>{isLoading ? 'Ro\'yxatdan o\'tilmoqda...' : t('auth.register_tab')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-1">
                <span className="text-[11px] text-slate-500">
                  {t('auth.have_account_prompt')}{' '}
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('LOGIN')}
                    className="font-bold text-brand-600 dark:text-brand-400 hover:underline ml-1"
                  >
                    {t('auth.switch_to_login')}
                  </button>
                </span>
              </div>
            </motion.form>
          )}

          {/* Dev Test Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
              {t('auth.dev_mode_title')}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => loginWithDevRole('SUPPLIER')}
                className="py-1.5 px-2 rounded-lg text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition"
              >
                📦 Ta'minotchi (Demo)
              </button>
              <button
                type="button"
                onClick={() => loginWithDevRole('RECEIVER')}
                className="py-1.5 px-2 rounded-lg text-[10px] font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 border border-teal-200 dark:border-teal-800 transition"
              >
                🛒 Qabul qiluvchi (Demo)
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 1. Interactive Google Sign-In Simulation Dialog */}
      <AnimatePresence>
        {isGooglePromptOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GoogleIcon />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Google hisobi orqali kirish
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGooglePromptOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1 font-medium">Google Email:</label>
                  <input
                    type="email"
                    value={googleInputEmail}
                    onChange={(e) => setGoogleInputEmail(e.target.value)}
                    placeholder="email@gmail.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-medium">Ism va Familiya:</label>
                  <input
                    type="text"
                    value={googleInputName}
                    onChange={(e) => setGoogleInputName(e.target.value)}
                    placeholder="Ism Familiya"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsGooglePromptOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 font-semibold"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExecuteGoogleAuth(googleInputEmail, googleInputName)}
                    className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/25"
                  >
                    <GoogleIcon />
                    <span>Davom etish</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. New Google User Role Picker Modal */}
      <AnimatePresence>
        {pendingGoogleUser && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <GoogleIcon />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {t('auth.select_role_google_title')}
                </h3>
                <p className="text-[11px] text-slate-500">{pendingGoogleUser.email}</p>
              </div>

              <form onSubmit={handleFinishGoogleRegister} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGoogleRole('RECEIVER')}
                    className={`p-3 rounded-xl border text-center transition ${
                      googleRole === 'RECEIVER'
                        ? 'border-brand-600 bg-brand-50 text-brand-700 font-bold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    🛒 Qabul qiluvchi
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoogleRole('SUPPLIER')}
                    className={`p-3 rounded-xl border text-center transition ${
                      googleRole === 'SUPPLIER'
                        ? 'border-brand-600 bg-brand-50 text-brand-700 font-bold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    📦 Ta'minotchi
                  </button>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-medium">Telefon raqam:</label>
                  <input
                    type="tel"
                    required
                    value={googlePhone}
                    onChange={(e) => setGooglePhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                {googleRole === 'SUPPLIER' && (
                  <div>
                    <label className="block text-slate-500 mb-1 font-medium">Do'kon / Kompaniya nomi:</label>
                    <input
                      type="text"
                      required
                      value={googleCompanyName}
                      onChange={(e) => setGoogleCompanyName(e.target.value)}
                      placeholder="Masalan: Fresh Market"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/25 mt-2"
                >
                  Tasdiqlash va Kirish
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
