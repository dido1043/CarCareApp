/* eslint-disable import/no-named-as-default-member --
 * `i18n` is i18next's singleton instance; `use` and `changeLanguage` are its
 * methods, not the same-named standalone exports the rule is warning about. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import bg from './locales/bg.json';
import en from './locales/en.json';

export const SUPPORTED_LANGUAGES = ['en', 'bg'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'en';
const STORAGE_KEY = 'carcare.language';

export function isSupportedLanguage(value: string | null | undefined): value is Language {
  return SUPPORTED_LANGUAGES.includes(value as Language);
}

/**
 * First launch follows the device: a phone set to Bulgarian opens in Bulgarian,
 * everything else falls back to English. Afterwards the stored choice wins.
 */
export function resolveDeviceLanguage(): Language {
  const deviceTag = Localization.getLocales()[0]?.languageCode;
  return isSupportedLanguage(deviceTag) ? deviceTag : DEFAULT_LANGUAGE;
}

export async function loadStoredLanguage(): Promise<Language | null> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  return isSupportedLanguage(stored) ? stored : null;
}

export async function persistLanguage(language: Language): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, language);
}

/** Resolves the startup language, then boots i18next with it. */
export async function initI18n(): Promise<Language> {
  const language = (await loadStoredLanguage()) ?? resolveDeviceLanguage();

  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      bg: { translation: bg },
    },
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    defaultNS: 'translation',
    // React already escapes everything it renders.
    interpolation: { escapeValue: false },
    returnNull: false,
    compatibilityJSON: 'v4',
  });

  return language;
}

export async function changeLanguage(language: Language): Promise<void> {
  await i18n.changeLanguage(language);
  await persistLanguage(language);
}

export { i18n };
