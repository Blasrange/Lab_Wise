// src/lib/i18n/i18n-provider.tsx
'use client';

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';
import en from './en.json';
import es from './es.json';

type Locale = 'en' | 'es';

const translations = { en, es };

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const storedLocale = localStorage.getItem('labwise-locale') as Locale | null;
    if (storedLocale && ['en', 'es'].includes(storedLocale)) {
      setLocaleState(storedLocale);
    } else {
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'es') {
        setLocaleState('es');
      }
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('labwise-locale', newLocale);
  };

  const t = useCallback(
    (key: string, replacements: Record<string, string | number> = {}) => {
      const keys = key.split('.');
      let result: any = translations[locale];
      for (const k of keys) {
        result = result?.[k];
        if (result === undefined) {
          // Fallback to English if translation is missing
          let fallbackResult: any = translations['en'];
          for (const fk of keys) {
            fallbackResult = fallbackResult?.[fk];
            if (fallbackResult === undefined) return key;
          }
          result = fallbackResult;
          break;
        }
      }

      if (typeof result === 'string') {
        return Object.entries(replacements).reduce((acc, [placeholder, value]) => {
            return acc.replace(`{${placeholder}}`, String(value));
        }, result);
      }

      return key; // Return the key itself if no valid translation is found
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
