import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uz from './locales/uz.json';
import ru from './locales/ru.json';
import en from './locales/en.json';
import { APP_CONFIG, STORAGE_KEYS } from '../constants';

const savedLang = localStorage.getItem(STORAGE_KEYS.LANGUAGE) || APP_CONFIG.DEFAULT_LANGUAGE;

i18n.use(initReactI18next).init({
  resources: {
    uz: { translation: uz },
    ru: { translation: ru },
    en: { translation: en },
  },
  lng: savedLang,
  fallbackLng: APP_CONFIG.DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
});

export const changeLanguage = (lang: string) => {
  i18n.changeLanguage(lang);
  localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
};

export default i18n;
