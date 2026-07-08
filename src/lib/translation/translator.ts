import {
  normalizeTranslationLanguage,
  type TranslationLanguageCode,
} from './language';
import { getLocalTranslation } from './localPacks';
import {
  createTranslationCacheKey,
  getCachedTranslation,
  setCachedTranslation,
} from './cache';

type TranslationProvider = {
  translate(input: {
    sourceLanguage: string;
    sourceText: string;
    targetLanguage: TranslationLanguageCode;
  }): Promise<string>;
};

const SOURCE_LANGUAGE = 'vi';
const MAX_CONCURRENCY = 3;
const ENABLE_RUNTIME_TRANSLATION_FALLBACK =
  typeof process !== 'undefined' &&
  process.env.EXPO_PUBLIC_ENABLE_RUNTIME_TRANSLATION_FALLBACK === '1';
const inFlightTranslations = new Map<string, Promise<string>>();
const loggedErrors = new Set<string>();
let activeCount = 0;
const queue: Array<() => void> = [];

declare const process:
  | {
      env: {
        EXPO_PUBLIC_ENABLE_RUNTIME_TRANSLATION_FALLBACK?: string;
        NODE_ENV?: string;
      };
    }
  | undefined;

const googleTranslateProvider: TranslationProvider = {
  async translate({ sourceLanguage, sourceText, targetLanguage }) {
    const url = new URL('https://translate.googleapis.com/translate_a/single');
    url.searchParams.set('client', 'gtx');
    url.searchParams.set('sl', sourceLanguage);
    url.searchParams.set('tl', targetLanguage);
    url.searchParams.set('dt', 't');
    url.searchParams.set('q', sourceText);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(url.toString(), { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Google Translate HTTP ${response.status}`);
      }

      const payload = (await response.json()) as unknown;
      const translated = parseGoogleTranslateResponse(payload);
      if (!translated.trim()) {
        throw new Error('Google Translate returned an empty result.');
      }
      return translated;
    } finally {
      clearTimeout(timeout);
    }
  },
};

export async function translateText(text: string, targetLanguage: string) {
  if (!text.trim()) return text;

  const normalizedTarget = normalizeTranslationLanguage(targetLanguage);
  if (normalizedTarget === SOURCE_LANGUAGE) return text;
  if (!shouldTranslateText(text)) return text;

  const localTranslation = getLocalTranslation(text, normalizedTarget);
  if (localTranslation !== null) return localTranslation;

  const cacheKey = createTranslationCacheKey({
    sourceLanguage: SOURCE_LANGUAGE,
    sourceText: text,
    targetLanguage: normalizedTarget,
  });

  const cached = await getCachedTranslation(cacheKey);
  if (cached) return cached;

  if (!ENABLE_RUNTIME_TRANSLATION_FALLBACK) {
    logMissingLocalTranslation(cacheKey, text, normalizedTarget);
    return text;
  }

  const existing = inFlightTranslations.get(cacheKey);
  if (existing) return existing;

  const request = runLimited(async () => {
    const translated = await googleTranslateProvider.translate({
      sourceLanguage: SOURCE_LANGUAGE,
      sourceText: text,
      targetLanguage: normalizedTarget,
    });
    await setCachedTranslation(cacheKey, translated);
    return translated;
  })
    .catch((error: unknown) => {
      logTranslationError(cacheKey, error);
      return text;
    })
    .finally(() => {
      inFlightTranslations.delete(cacheKey);
    });

  inFlightTranslations.set(cacheKey, request);
  return request;
}

function runLimited<T>(task: () => Promise<T>) {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      activeCount += 1;
      task()
        .then(resolve, reject)
        .finally(() => {
          activeCount -= 1;
          const next = queue.shift();
          if (next) next();
        });
    };

    if (activeCount < MAX_CONCURRENCY) run();
    else queue.push(run);
  });
}

function parseGoogleTranslateResponse(payload: unknown) {
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) return '';

  const segments = payload[0]
    .map((segment) => {
      if (!Array.isArray(segment)) return '';
      return typeof segment[0] === 'string' ? segment[0] : '';
    })
    .filter(Boolean);

  return segments.join('');
}

function shouldTranslateText(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^https?:\/\//i.test(trimmed)) return false;
  if (/^(file|data):/i.test(trimmed)) return false;
  if (/^[\d\s.,:+/%-]+$/.test(trimmed)) return false;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return false;
  return /[A-Za-zÀ-ỹ]/.test(trimmed);
}

function logTranslationError(key: string, error: unknown) {
  if (!isDevelopment()) return;
  if (loggedErrors.has(key)) return;
  loggedErrors.add(key);
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[translation] ${message}`);
}

function logMissingLocalTranslation(
  key: string,
  text: string,
  targetLanguage: TranslationLanguageCode,
) {
  if (!isDevelopment()) return;
  if (loggedErrors.has(key)) return;
  loggedErrors.add(key);
  console.warn(
    `[translation] missing local ${targetLanguage} translation: ${text.slice(0, 120)}`,
  );
}

function isDevelopment() {
  const runtime = globalThis as { __DEV__?: boolean; process?: { env?: { NODE_ENV?: string } } };
  if (typeof runtime.__DEV__ === 'boolean') return runtime.__DEV__;
  return runtime.process?.env?.NODE_ENV !== 'production';
}
