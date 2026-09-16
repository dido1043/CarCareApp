import { changeLanguage, isSupportedLanguage, type Language } from '@/i18n';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * The current language as a narrowed `Language`, plus the setter. Screens use
 * this instead of reading `i18n.language`, which is a plain string and can carry
 * a region suffix.
 */
export function useLanguage(): {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
} {
  const { i18n } = useTranslation();
  const current = i18n.language.split('-')[0];

  const setLanguage = useCallback(async (language: Language) => {
    await changeLanguage(language);
  }, []);

  return {
    language: isSupportedLanguage(current) ? current : 'en',
    setLanguage,
  };
}
