import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

export type TranslationLanguageCode =
  | 'en'
  | 'vi'
  | 'ja'
  | 'ko'
  | 'zh-CN'
  | 'zh-TW'
  | 'th'
  | 'fr'
  | 'de'
  | 'es';

const languageAliases: Record<string, TranslationLanguageCode> = {
  chinese: 'zh-CN',
  'chinese simplified': 'zh-CN',
  'chinese traditional': 'zh-TW',
  de: 'de',
  german: 'de',
  en: 'en',
  english: 'en',
  es: 'es',
  spanish: 'es',
  fr: 'fr',
  french: 'fr',
  ja: 'ja',
  japanese: 'ja',
  ko: 'ko',
  korean: 'ko',
  th: 'th',
  thai: 'th',
  vi: 'vi',
  vietnamese: 'vi',
  zh: 'zh-CN',
  'zh-cn': 'zh-CN',
  'zh-hans': 'zh-CN',
  'zh-hant': 'zh-TW',
  'zh-tw': 'zh-TW',
};

export const AppLanguageContext = createContext<string>('English');

export function AppLanguageProvider({
  children,
  language,
}: {
  children: ReactNode;
  language: string;
}) {
  return (
    <AppLanguageContext.Provider value={language}>
      {children}
    </AppLanguageContext.Provider>
  );
}

export function useAppSelectedLanguage() {
  return useContext(AppLanguageContext);
}

export function normalizeTranslationLanguage(language: string): TranslationLanguageCode {
  const normalized = language.trim().replace(/_/g, '-').toLowerCase();
  if (languageAliases[normalized]) return languageAliases[normalized];

  const base = normalized.split('-')[0];
  return languageAliases[base] ?? 'en';
}

export function isVietnameseLanguage(language: string) {
  return normalizeTranslationLanguage(language) === 'vi';
}
