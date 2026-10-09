import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, LanguageCode } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/languages';
import { TranslationKey, getTranslation } from '../data/translations';

interface LanguageContextType {
  selectedLanguage: LanguageCode;
  setSelectedLanguage: (lang: LanguageCode) => void;
  setLanguage: (lang: LanguageCode) => void;
  currentLanguage: Language;
  isRtl: boolean;
  isRTL: boolean;
  t: (key: TranslationKey | string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'paklingo_selected_language';

export const LanguageProvider: React.FC<{
  children: React.ReactNode;
  initialLanguage?: LanguageCode;
}> = ({ children, initialLanguage }) => {
  const [selectedLanguage, setSelectedLanguageState] = useState<LanguageCode>(() => {
    if (initialLanguage) return initialLanguage;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        return saved;
      }
    }
    return 'ur';
  });

  const setSelectedLanguage = (lang: LanguageCode) => {
    setSelectedLanguageState(lang);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch (e) {
        console.warn('Could not persist selected language:', e);
      }
    }
  };

  const currentLanguage =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  const isRtl = currentLanguage.direction === 'rtl';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = selectedLanguage;
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    }
  }, [selectedLanguage, isRtl]);

  const t = (key: TranslationKey | string, fallback?: string): string => {
    return getTranslation(selectedLanguage, key, fallback);
  };

  return (
    <LanguageContext.Provider
      value={{
        selectedLanguage,
        setSelectedLanguage,
        setLanguage: setSelectedLanguage,
        currentLanguage,
        isRtl,
        isRTL: isRtl,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
