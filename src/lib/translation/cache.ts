import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'vinago:translation:v1';
const memoryCache = new Map<string, string>();

export function createTranslationCacheKey({
  sourceLanguage,
  sourceText,
  targetLanguage,
}: {
  sourceLanguage: string;
  sourceText: string;
  targetLanguage: string;
}) {
  return `${CACHE_PREFIX}:${sourceLanguage}:${targetLanguage}:${hashString(sourceText)}`;
}

export async function getCachedTranslation(key: string) {
  const memoryValue = memoryCache.get(key);
  if (typeof memoryValue === 'string') return memoryValue;

  const stored = await AsyncStorage.getItem(key);
  if (stored) {
    memoryCache.set(key, stored);
    return stored;
  }
  return null;
}

export async function setCachedTranslation(key: string, value: string) {
  if (!value.trim()) return;
  memoryCache.set(key, value);
  await AsyncStorage.setItem(key, value);
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
