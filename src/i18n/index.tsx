import React, { createContext, useContext, useState, useMemo } from 'react';
import type { Translations, SupportedLanguageCode, LanguageMeta } from './types';
import { LANGUAGES } from './types';
import { en } from './en';
import { as } from './as';
import { nyi } from './nyi';
import { mni } from './mni';
import { kha } from './kha';
import { lus } from './lus';
import { ao } from './ao';
import { ne } from './ne';
import { kok } from './kok';

export * from './types';

export const TRANSLATIONS: Record<SupportedLanguageCode, Translations> = {
  en,
  as,
  nyi,
  mni,
  kha,
  lus,
  ao,
  ne,
  kok,
};

const STORAGE_KEY = 'recallia_preferred_language';

interface I18nContextType {
  language: SupportedLanguageCode;
  translations: Translations;
  t: Translations;
  currentLanguageMeta: LanguageMeta;
  setLanguage: (lang: SupportedLanguageCode) => void;
  hasSelectedLanguage: boolean;
  clearSavedLanguage: () => void;
  languages: LanguageMeta[];
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguageCode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved in TRANSLATIONS) {
      return saved as SupportedLanguageCode;
    }
    return 'en';
  });

  const [hasSelectedLanguage, setHasSelectedLanguage] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return Boolean(saved && saved in TRANSLATIONS);
  });

  const setLanguage = (lang: SupportedLanguageCode) => {
    if (lang in TRANSLATIONS) {
      setLanguageState(lang);
      localStorage.setItem(STORAGE_KEY, lang);
      setHasSelectedLanguage(true);
    }
  };

  const clearSavedLanguage = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHasSelectedLanguage(false);
  };

  const currentLanguageMeta = useMemo(() => {
    return LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  }, [language]);

  const currentTranslations = useMemo(() => {
    return TRANSLATIONS[language] || TRANSLATIONS.en;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      translations: currentTranslations,
      t: currentTranslations,
      currentLanguageMeta,
      setLanguage,
      hasSelectedLanguage,
      clearSavedLanguage,
      languages: LANGUAGES,
    }),
    [language, currentTranslations, currentLanguageMeta, hasSelectedLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
