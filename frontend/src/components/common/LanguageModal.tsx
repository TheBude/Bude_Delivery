import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Check, Globe, X, ChevronDown, Sparkles } from 'lucide-react';
import { changeLanguage } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { hapticImpact, hapticSelection } from '../../utils/telegram';

export interface LanguageOption {
  code: 'uz' | 'ru' | 'en';
  title: string;
  nativeTitle: string;
  flag: string;
  description: string;
}

export const AVAILABLE_LANGUAGES: LanguageOption[] = [
  {
    code: 'uz',
    title: "O'zbekcha",
    nativeTitle: "O'zbekcha",
    flag: '🇺🇿',
    description: 'Lotin alifbosi • O‘zbekiston',
  },
  {
    code: 'ru',
    title: 'Русский',
    nativeTitle: 'Русский язык',
    flag: '🇷🇺',
    description: 'Русский интерфейс',
  },
  {
    code: 'en',
    title: 'English',
    nativeTitle: 'English',
    flag: '🇬🇧',
    description: 'International version',
  },
];

interface LanguageButtonProps {
  onClick: () => void;
  className?: string;
  variant?: 'compact' | 'normal';
}

export const LanguageButton: React.FC<LanguageButtonProps> = ({
  onClick,
  className = '',
  variant = 'compact',
}) => {
  const { i18n } = useTranslation();
  const currentLang =
    AVAILABLE_LANGUAGES.find((l) => l.code === i18n.language) ||
    AVAILABLE_LANGUAGES[0];

  return (
    <button
      type="button"
      onClick={() => {
        hapticImpact('light');
        onClick();
      }}
      title="Tilni o'zgartirish / Сменить язык / Change language"
      className={`group flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 shadow-xs hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 active:scale-95 transition-all ${
        variant === 'compact' ? 'px-2.5 py-1 text-xs' : 'px-3 py-2 text-xs font-semibold'
      } ${className}`}
    >
      <span className="text-sm leading-none shrink-0">{currentLang.flag}</span>
      <span className="font-bold tracking-wider text-[11px] uppercase">
        {currentLang.code}
      </span>
      <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-brand-500 transition-transform group-hover:translate-y-0.5" />
    </button>
  );
};

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const { updateUserProfile, user } = useAuth();

  const handleSelect = async (code: 'uz' | 'ru' | 'en') => {
    hapticSelection();
    changeLanguage(code);

    // If logged in, optionally sync language preference to user profile in background
    if (user?.id) {
      try {
        await updateUserProfile({ language: code });
      } catch {
        // Silent
      }
    }

    hapticImpact('medium');
    setTimeout(() => {
      onClose();
    }, 150);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-xs">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 leading-tight">
                    {t('language.title', 'Tilni tanlang')}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {t('language.subtitle', 'Ilova interfeysi tili')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  hapticImpact('light');
                  onClose();
                }}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Language Options List */}
            <div className="space-y-2 pt-1">
              {AVAILABLE_LANGUAGES.map((lang) => {
                const isSelected = i18n.language === lang.code;

                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelect(lang.code)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/70 dark:bg-brand-950/40 shadow-sm ring-2 ring-brand-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl drop-shadow-xs">{lang.flag}</span>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{lang.nativeTitle}</span>
                          {isSelected && (
                            <span className="text-[9px] font-extrabold bg-brand-600 text-white px-1.5 py-0.2 rounded-md">
                              FAOL
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {lang.description}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'border border-slate-300 dark:border-slate-700 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Tanlangan til avtomatik xotirada saqlanadi</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
