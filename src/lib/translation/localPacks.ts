import { generatedTranslationPacks } from './generatedPacks';
import {
  normalizeTranslationLanguage,
  type TranslationLanguageCode,
} from './language';

export function getLocalTranslation(text: string, targetLanguage: string): string | null {
  const normalizedTarget = normalizeTranslationLanguage(targetLanguage);
  if (normalizedTarget === 'vi') return text;
  if (!text.trim()) return text;

  const exact = getExactLocalTranslation(text, normalizedTarget);
  if (exact !== null) return exact;

  return translateDelimitedText(text, normalizedTarget);
}

export function translateStaticText(
  text: string,
  targetLanguage: string,
  fallback?: string,
): string {
  return getLocalTranslation(text, targetLanguage) ?? fallback ?? text;
}

function getExactLocalTranslation(
  text: string,
  targetLanguage: TranslationLanguageCode,
): string | null {
  const pack = generatedTranslationPacks[targetLanguage];
  if (!pack) return null;

  const direct = pack[text];
  if (typeof direct === 'string' && direct.trim()) return direct;

  const trimmed = text.trim();
  if (trimmed !== text) {
    const trimmedTranslation = pack[trimmed];
    if (typeof trimmedTranslation === 'string' && trimmedTranslation.trim()) {
      return text.replace(trimmed, trimmedTranslation);
    }
  }

  return null;
}

function translateDelimitedText(
  text: string,
  targetLanguage: TranslationLanguageCode,
): string | null {
  const plusMatch = text.match(/^(.+)\s\+(\d+)$/u);
  if (plusMatch) {
    const translatedPrefix = translateDelimitedText(plusMatch[1], targetLanguage);
    if (translatedPrefix !== null) return `${translatedPrefix} +${plusMatch[2]}`;
  }

  const delimiters = [', ', ' · ', ' / '];
  for (const delimiter of delimiters) {
    if (!text.includes(delimiter)) continue;
    const parts = text.split(delimiter);
    const translatedParts = parts.map((part) => getExactLocalTranslation(part, targetLanguage));
    if (translatedParts.every((part): part is string => part !== null)) {
      return translatedParts.join(delimiter);
    }
  }

  return null;
}
