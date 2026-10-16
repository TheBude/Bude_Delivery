import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { isDemoSession, api } from '../../api/client';
import { 
  Moon, Sun, LogOut, Truck, User, 
  X, Check, RotateCcw, Phone, Mail, ShieldCheck, Building2, Globe 
} from 'lucide-react';
import { hapticImpact, hapticNotification } from '../../utils/telegram';
import { LanguageButton, LanguageModal } from './LanguageModal';

interface HeaderProps {
  onOpenAdmin?: () => void;
  isAdmin?: boolean;
  adminViewMode?: 'ADMIN' | 'SUPPLIER' | 'RECEIVER';
  onAdminViewModeChange?: (mode: 'ADMIN' | 'SUPPLIER' | 'RECEIVER') => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenAdmin, 
  isAdmin, 
  adminViewMode, 
  onAdminViewModeChange 
}) => {
  const { t, i18n } = useTranslation();
  const { user, supplier, logout, updateUserProfile } = useAuth();
  const [isDark, setIsDark] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Profile Modal State
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [editFirstName, setEditFirstName] = useState<string>('');
  const [editLastName, setEditLastName] = useState<string>('');
  const [editPhonePrimary, setEditPhonePrimary] = useState<string>('');
  const [editPhoneSecondary, setEditPhoneSecondary] = useState<string>('');
  const [editCompanyName, setEditCompanyName] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [isLangModalOpen, setIsLangModalOpen] = useState<boolean>(false);

  const toggleDarkMode = () => {
    hapticImpact('light');
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const openProfileModal = () => {
    hapticImpact('light');
    if (user) {
      setEditFirstName(user.first_name || '');
      setEditLastName(user.last_name || '');
      setEditPhonePrimary(user.phone_primary || '');
      setEditPhoneSecondary(user.phone_secondary || '');
      setEditCompanyName(user.company_name || supplier?.company_name || '');
      setProfileMessage(null);
    }
    setIsProfileOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    hapticImpact('medium');
    setIsSaving(true);
    setProfileMessage(null);

    try {
      await updateUserProfile({
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        phone_primary: editPhonePrimary.trim(),
        phone_secondary: editPhoneSecondary.trim() || null,
        company_name: editCompanyName.trim() || null,
      });
      setProfileMessage(t('profile.save_success'));
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || t('profile.save_error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDemoData = async () => {
    hapticImpact('heavy');
    if (confirm(t('profile.reset_demo_confirm'))) {
      await api.auth.resetDemo();
      hapticNotification('success');
      window.location.reload();
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-lg bg-white/85 dark:bg-slate-900/85 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        {/* Main Clean Professional Bar */}
        <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                Bude Delivery
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[170px]">
                {supplier?.company_name || user?.company_name || (user?.role === 'RECEIVER' ? "B2B/B2C Katalog" : "Logistika Tizimi")}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {/* Modern Language Button */}
            <LanguageButton onClick={() => setIsLangModalOpen(true)} />

            {/* Admin Dashboard Button */}
            {isAdmin && onOpenAdmin && (
              <button
                onClick={() => {
                  hapticImpact('medium');
                  onOpenAdmin();
                }}
                title="Admin Boshqaruv Paneli"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700/60 shadow-xs hover:scale-105 active:scale-95 transition-all"
              >
                <span>👑</span>
                <span>Admin</span>
              </button>
            )}

            {/* Dark Mode */}
            <button
              onClick={toggleDarkMode}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Profile Button */}
            {user && (
              <button
                onClick={openProfileModal}
                title="Profil"
                className="p-1.5 rounded-lg text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 dark:hover:bg-brand-900/60 transition"
              >
                <User className="w-4 h-4" />
              </button>
            )}

            {/* Logout if authenticated */}
            {user && (
              <button
                onClick={logout}
                title={t('auth.logout')}
                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Admin Mode Switcher Bar */}
        {isAdmin && onAdminViewModeChange && (
          <div className="bg-amber-500/10 dark:bg-amber-500/15 border-t border-amber-300/40 dark:border-amber-700/40 px-4 py-1.5 flex items-center justify-between text-xs max-w-md mx-auto">
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
              <span>👑</span>
              <span>{t('admin.view_mode', 'Ko‘rinish:')}</span>
            </span>
            <div className="flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 p-0.5 rounded-xl text-[11px] font-bold border border-amber-200/50 dark:border-amber-800/50">
              <button
                type="button"
                onClick={() => {
                  hapticImpact('light');
                  onAdminViewModeChange('ADMIN');
                }}
                className={`px-2.5 py-1 rounded-lg transition ${
                  adminViewMode === 'ADMIN'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-amber-600'
                }`}
              >
                👑 {t('admin.tab_admin', 'Boshqaruv')}
              </button>
              <button
                type="button"
                onClick={() => {
                  hapticImpact('light');
                  onAdminViewModeChange('SUPPLIER');
                }}
                className={`px-2.5 py-1 rounded-lg transition ${
                  adminViewMode === 'SUPPLIER'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                }`}
              >
                🚚 {t('admin.tab_supplier', 'Ta‘minotchi')}
              </button>
              <button
                type="button"
                onClick={() => {
                  hapticImpact('light');
                  onAdminViewModeChange('RECEIVER');
                }}
                className={`px-2.5 py-1 rounded-lg transition ${
                  adminViewMode === 'RECEIVER'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-brand-600'
                }`}
              >
                🏪 {t('admin.tab_receiver', 'Do‘kon')}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* User Profile Modal */}
      <AnimatePresence>
        {isProfileOpen && user && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-4 bg-gradient-to-r from-brand-600 to-teal-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm leading-tight">
                      {user.first_name} {user.last_name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-white/80">
                      <ShieldCheck className="w-3 h-3" />
                      <span>
                        {user.role === 'ADMIN'
                          ? `👑 ${t('profile.role_admin', 'Bosh Administrator')}`
                          : user.role === 'SUPPLIER'
                          ? `🚚 ${t('profile.role_supplier', 'Yetkazib beruvchi (Diler)')}`
                          : `🏪 ${t('profile.role_receiver', 'Qabul qiluvchi do‘kon')}`}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content */}
              <form onSubmit={handleSaveProfile} className="p-4 space-y-3.5 overflow-y-auto flex-1 text-xs">
                {profileMessage && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium text-[11px] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>{profileMessage}</span>
                  </div>
                )}

                {/* Edit Fields */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      {t('auth.first_name', 'Ism')}
                    </label>
                    <input
                      type="text"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 outline-hidden font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      {t('auth.last_name', 'Familiya')}
                    </label>
                    <input
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 outline-hidden font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Phone className="w-3 h-3 text-brand-600" />
                    {t('auth.phone_primary', 'Asosiy telefon raqami')}
                  </label>
                  <input
                    type="text"
                    value={editPhonePrimary}
                    onChange={(e) => setEditPhonePrimary(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 outline-hidden font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {t('auth.phone_secondary', 'Qo‘shimcha telefon raqami (ixtiyoriy)')}
                  </label>
                  <input
                    type="text"
                    value={editPhoneSecondary}
                    onChange={(e) => setEditPhoneSecondary(e.target.value)}
                    placeholder="+998 90 000 00 00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 outline-hidden font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-brand-600" />
                    {t('auth.company_name', 'Kompaniya yoki Do‘kon nomi')}
                  </label>
                  <input
                    type="text"
                    value={editCompanyName}
                    onChange={(e) => setEditCompanyName(e.target.value)}
                    placeholder="Masalan: Fayz Savdo MCHJ"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 outline-hidden font-medium"
                  />
                </div>

                {/* Language Setting Row in Profile */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Globe className="w-3 h-3 text-brand-600" />
                    {t('language.subtitle', 'Ilova interfeysi tili')}
                  </label>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span className="text-base">{i18n.language === 'ru' ? '🇷🇺' : i18n.language === 'en' ? '🇬🇧' : '🇺🇿'}</span>
                      <span>{i18n.language === 'ru' ? 'Русский язык' : i18n.language === 'en' ? 'English' : "O‘zbekcha"}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsLangModalOpen(true)}
                      className="px-2.5 py-1 text-[11px] font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 rounded-lg transition"
                    >
                      {t('language.change_btn', 'O‘zgartirish')}
                    </button>
                  </div>
                </div>

                {user.email && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-slate-500">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="text-[11px] truncate">{user.email}</span>
                  </div>
                )}

                {/* Save button */}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/25 active:scale-[0.98] transition flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSaving ? t('common.saving', 'Saqlanmoqda...') : t('common.save', 'Saqlash')}</span>
                </button>

                {/* Demo Data Reset Button */}
                {isDemoSession() && (
                  <button
                    type="button"
                    onClick={handleResetDemoData}
                    className="w-full mt-2 py-2 px-3 rounded-xl font-semibold text-[11px] border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Namunaviy test ma'lumotlarini tiklash</span>
                  </button>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Language Selection Modal */}
      <LanguageModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
      />
    </>
  );
};

