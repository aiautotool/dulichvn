#!/usr/bin/env node
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const SOURCE_LANGUAGE = 'vi';
const OUTPUT_PATH = path.join(ROOT, 'src/lib/translation/generatedPacks.ts');
const CACHE_DIR = path.join(ROOT, '.cache/translation-packs');
const GOOGLE_TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single';
const DELIMITER = '§§VINAGO_TRANSLATION_SPLIT§§';
const DELIMITER_PATTERN = /\s*§§\s*VINAGO_TRANSLATION_SPLIT\s*§§\s*/u;
const MAX_BATCH_ITEMS = Number.parseInt(process.env.TRANSLATION_BATCH_ITEMS ?? '24', 10);
const MAX_BATCH_CHARS = Number.parseInt(process.env.TRANSLATION_BATCH_CHARS ?? '3500', 10);
const MAX_CONCURRENCY = Number.parseInt(process.env.TRANSLATION_CONCURRENCY ?? '3', 10);
const MAX_RETRIES = Number.parseInt(process.env.TRANSLATION_RETRIES ?? '3', 10);

const targetLanguages = ['en', 'ja', 'ko', 'zh-CN', 'zh-TW', 'th', 'fr', 'de', 'es'];
const languageAliases = {
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

const translatableKeys = new Set([
  'address',
  'allergens',
  'bestTime',
  'category',
  'city',
  'content',
  'description',
  'donts',
  'dos',
  'explanation',
  'history',
  'howToOrder',
  'ingredients',
  'label',
  'longDescription',
  'name',
  'note',
  'openHours',
  'phrase',
  'province',
  'priceRange',
  'region',
  'requirements',
  'shortDescription',
  'subtitle',
  'summary',
  'tags',
  'ticketPrice',
  'tips',
  'title',
  'titleKey',
  'travelTip',
  'vietnamese',
  'whyGo',
]);

const technicalKeys = new Set([
  'amount',
  'code',
  'createdAt',
  'currency',
  'difficulty',
  'email',
  'english',
  'englishName',
  'icon',
  'id',
  'image',
  'imageKey',
  'images',
  'imageUrl',
  'key',
  'lat',
  'latitude',
  'lng',
  'longitude',
  'phone',
  'picture',
  'price',
  'pronunciation',
  'publishedAt',
  'rating',
  'score',
  'slug',
  'sortOrder',
  'source',
  'sourceUrl',
  'spicyLevel',
  'status',
  'thumbnail',
  'timestamp',
  'type',
  'updatedAt',
  'url',
  'uuid',
  'video',
  'videoUrl',
  'website',
  'wikidataId',
  'wikipediaUrl',
]);

const appConstantsToCollect = new Set([
  'cities',
  'cultureTopics',
  'emergencyCards',
  'foods',
  'onboardingCities',
  'phrases',
  'purposes',
  'quickQuestions',
]);

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const languageArg = args.find((arg) => arg.startsWith('--language='));
const selectedLanguages = languageArg
  ? [normalizeScriptLanguage(languageArg.replace(/^--language=/u, ''))]
  : targetLanguages;

if (selectedLanguages.includes(SOURCE_LANGUAGE)) {
  throw new Error('The source language is Vietnamese; no pack is generated for vi.');
}

const requireFromRoot = createRequire(path.join(ROOT, 'scripts/build-local-translation-packs.mjs'));
const moduleCache = new Map();

const sourceStrings = collectSourceStrings();

if (dryRun) {
  const totalChars = sourceStrings.reduce((sum, item) => sum + item.length, 0);
  console.log(`Collected ${sourceStrings.length} unique source strings (${totalChars} chars).`);
  console.log(`Target languages: ${selectedLanguages.join(', ')}`);
  console.log(sourceStrings.slice(0, 20));
  process.exit(0);
}

await fs.mkdir(CACHE_DIR, { recursive: true });

for (const language of selectedLanguages) {
  await buildLanguageCache(language, sourceStrings);
}

await writeGeneratedPacks(sourceStrings);

console.log(`Wrote ${path.relative(ROOT, OUTPUT_PATH)}`);

function normalizeScriptLanguage(language) {
  const normalized = language.trim().replace(/_/gu, '-').toLowerCase();
  const result = languageAliases[normalized] ?? languageAliases[normalized.split('-')[0]];
  if (!result || result === SOURCE_LANGUAGE || !targetLanguages.includes(result)) {
    throw new Error(`Unsupported translation language: ${language}`);
  }
  return result;
}

function collectSourceStrings() {
  const strings = [];
  const seen = new Set();
  const addString = (value) => {
    const trimmed = value.trim();
    if (!shouldTranslateText(trimmed) || seen.has(trimmed)) return;
    seen.add(trimmed);
    strings.push(trimmed);
  };

  const placeStore = loadTypeScriptModule(path.join(ROOT, 'src/data/placeStore.ts'));
  collectTranslatableValue(placeStore.travelPlaceSeeds, undefined, false, addString);
  collectAppStrings(addString);

  return strings;
}

function collectTranslatableValue(value, key, forceTranslate, addString) {
  if (typeof value === 'string') {
    if (forceTranslate || (key ? translatableKeys.has(key) : false)) addString(value);
    return;
  }

  if (Array.isArray(value)) {
    const shouldTranslateItems = key ? translatableKeys.has(key) : forceTranslate;
    for (const item of value) {
      collectTranslatableValue(item, key, shouldTranslateItems, addString);
    }
    return;
  }

  if (!value || typeof value !== 'object') return;

  for (const [entryKey, entryValue] of Object.entries(value)) {
    if (technicalKeys.has(entryKey)) continue;
    collectTranslatableValue(entryValue, entryKey, translatableKeys.has(entryKey), addString);
  }
}

function collectAppStrings(addString) {
  const appPath = path.join(ROOT, 'App.tsx');
  const source = fsSync.readFileSync(appPath, 'utf8');
  const sourceFile = ts.createSourceFile(appPath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const initializer = unwrapExpression(node.initializer);
      if (appConstantsToCollect.has(node.name.text)) {
        collectAstTranslatableValue(initializer, undefined, true, addString);
      }
      if (node.name.text === 'translations') {
        collectVietnameseDictionaryStrings(initializer, addString);
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
}

function collectAstTranslatableValue(node, key, forceTranslate, addString) {
  node = unwrapExpression(node);

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    if (forceTranslate || (key ? translatableKeys.has(key) : false)) addString(node.text);
    return;
  }

  if (ts.isArrayLiteralExpression(node)) {
    const shouldTranslateItems = key ? translatableKeys.has(key) : forceTranslate;
    for (const element of node.elements) {
      collectAstTranslatableValue(element, key, shouldTranslateItems, addString);
    }
    return;
  }

  if (!ts.isObjectLiteralExpression(node)) return;

  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const propertyKey = getPropertyName(property.name);
    if (propertyKey && technicalKeys.has(propertyKey)) continue;
    collectAstTranslatableValue(
      property.initializer,
      propertyKey,
      propertyKey ? translatableKeys.has(propertyKey) : false,
      addString,
    );
  }
}

function collectVietnameseDictionaryStrings(node, addString) {
  node = unwrapExpression(node);
  if (!ts.isObjectLiteralExpression(node)) return;
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property) || getPropertyName(property.name) !== 'vi') continue;
    collectAllStringLiterals(property.initializer, addString);
  }
}

function collectAllStringLiterals(node, addString) {
  node = unwrapExpression(node);
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    addString(node.text);
    return;
  }
  ts.forEachChild(node, (child) => collectAllStringLiterals(child, addString));
}

function getPropertyName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  return undefined;
}

function unwrapExpression(node) {
  let current = node;
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current) ||
    ts.isNonNullExpression(current) ||
    ts.isTypeAssertionExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function loadTypeScriptModule(filePath) {
  const absolutePath = path.resolve(filePath);
  const existing = moduleCache.get(absolutePath);
  if (existing) return existing.exports;

  const source = fsSync.readFileSync(absolutePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: absolutePath,
  }).outputText;

  const module = { exports: {} };
  moduleCache.set(absolutePath, module);

  const localRequire = (specifier) => {
    if (specifier === 'expo-sqlite') return {};
    if (specifier.startsWith('.')) {
      return loadTypeScriptModule(resolveLocalModule(path.dirname(absolutePath), specifier));
    }
    return requireFromRoot(specifier);
  };

  const wrapper = vm.runInNewContext(
    `(function (exports, require, module, __filename, __dirname) { ${output}\n})`,
    { console, process },
    { filename: absolutePath },
  );
  wrapper(module.exports, localRequire, module, absolutePath, path.dirname(absolutePath));
  return module.exports;
}

function resolveLocalModule(baseDir, specifier) {
  const basePath = path.resolve(baseDir, specifier);
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
  ];
  const resolved = candidates.find((candidate) => {
    try {
      return fsSync.statSync(candidate).isFile();
    } catch {
      return false;
    }
  });
  if (!resolved) throw new Error(`Cannot resolve ${specifier} from ${baseDir}`);
  return resolved;
}

function shouldTranslateText(value) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^https?:\/\//iu.test(trimmed)) return false;
  if (/^(file|data):/iu.test(trimmed)) return false;
  if (/^[\d\s.,:+/%-]+$/u.test(trimmed)) return false;
  if (/^\d{4}-\d{2}-\d{2}/u.test(trimmed)) return false;
  return /[A-Za-zÀ-ỹ]/u.test(trimmed);
}

async function buildLanguageCache(language, strings) {
  const cache = await readJson(cachePathForLanguage(language), {});
  const missing = strings.filter((sourceText) => !hasUsableTranslation(cache[sourceText]));

  if (missing.length === 0) {
    console.log(`[${language}] cache complete (${strings.length} strings).`);
    return;
  }

  const chunks = createChunks(missing);
  let completed = 0;
  let fallbackCount = 0;
  console.log(`[${language}] translating ${missing.length} strings in ${chunks.length} chunks...`);

  await runPool(chunks, MAX_CONCURRENCY, async (chunk) => {
    const translations = await translateChunk(chunk, language);
    for (let index = 0; index < chunk.length; index += 1) {
      const sourceText = chunk[index];
      const translatedText = translations[index]?.trim();
      cache[sourceText] = normalizeTranslatedText(sourceText, translatedText || sourceText);
      if (!translatedText) fallbackCount += 1;
    }
    completed += chunk.length;
    if (completed === missing.length || completed % 120 < chunk.length) {
      console.log(`[${language}] ${completed}/${missing.length}`);
    }
  });

  await writeJson(cachePathForLanguage(language), orderRecordBy(strings, cache));
  if (fallbackCount > 0) {
    console.warn(`[${language}] ${fallbackCount} strings fell back to source text.`);
  }
}

function hasUsableTranslation(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function createChunks(strings) {
  const chunks = [];
  let current = [];
  let currentChars = 0;

  for (const sourceText of strings) {
    const nextChars = sourceText.length + DELIMITER.length + 2;
    if (
      current.length > 0 &&
      (current.length >= MAX_BATCH_ITEMS || currentChars + nextChars > MAX_BATCH_CHARS)
    ) {
      chunks.push(current);
      current = [];
      currentChars = 0;
    }
    current.push(sourceText);
    currentChars += nextChars;
  }

  if (current.length > 0) chunks.push(current);
  return chunks;
}

async function translateChunk(chunk, targetLanguage) {
  if (chunk.length === 1) {
    return [await translateSingle(chunk[0], targetLanguage)];
  }

  try {
    const translated = await translateRaw(chunk.join(`\n${DELIMITER}\n`), targetLanguage);
    const parts = translated.split(DELIMITER_PATTERN).map((part) => part.trim());
    if (parts.length === chunk.length && parts.every(Boolean)) return parts;
  } catch (error) {
    console.warn(`[${targetLanguage}] batch failed: ${toErrorMessage(error)}`);
  }

  return Promise.all(chunk.map((sourceText) => translateSingle(sourceText, targetLanguage)));
}

async function translateSingle(sourceText, targetLanguage) {
  try {
    return await translateRaw(sourceText, targetLanguage);
  } catch (error) {
    console.warn(`[${targetLanguage}] failed: ${sourceText.slice(0, 80)} (${toErrorMessage(error)})`);
    return sourceText;
  }
}

async function translateRaw(sourceText, targetLanguage) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const url = new URL(GOOGLE_TRANSLATE_URL);
      url.searchParams.set('client', 'gtx');
      url.searchParams.set('sl', SOURCE_LANGUAGE);
      url.searchParams.set('tl', targetLanguage);
      url.searchParams.set('dt', 't');
      url.searchParams.set('q', sourceText);

      const response = await fetch(url.toString(), { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const translated = parseGoogleTranslateResponse(payload).trim();
      if (!translated) throw new Error('empty response');
      return translated;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) {
        await delay(500 * attempt);
      }
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

function parseGoogleTranslateResponse(payload) {
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) return '';
  return payload[0]
    .map((segment) => (Array.isArray(segment) && typeof segment[0] === 'string' ? segment[0] : ''))
    .filter(Boolean)
    .join('');
}

async function runPool(items, concurrency, worker) {
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const item = items[index];
      index += 1;
      await worker(item);
    }
  });
  await Promise.all(workers);
}

async function writeGeneratedPacks(strings) {
  const packs = {};
  for (const language of targetLanguages) {
    const cache = await readJson(cachePathForLanguage(language), {});
    const pack = orderRecordBy(strings, cache);
    if (Object.keys(pack).length > 0) packs[language] = pack;
  }

  const header = [
    '/* eslint-disable quote-props */',
    '// Generated by scripts/build-local-translation-packs.mjs.',
    '// Do not edit manually; update source data or cache overrides and regenerate.',
    '',
    "import type { TranslationLanguageCode } from './language';",
    '',
    'type GeneratedTranslationPacks = Partial<Record<TranslationLanguageCode, Record<string, string>>>;',
    '',
  ].join('\n');

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(
    OUTPUT_PATH,
    `${header}export const generatedTranslationPacks: GeneratedTranslationPacks = ${toTsValue(packs)};\n`,
  );
}

function orderRecordBy(strings, record) {
  const ordered = {};
  for (const sourceText of strings) {
    const translatedText = record[sourceText];
    if (hasUsableTranslation(translatedText)) {
      ordered[sourceText] = normalizeTranslatedText(sourceText, translatedText);
    }
  }
  return ordered;
}

function normalizeTranslatedText(sourceText, translatedText) {
  return preserveSourceFlags(sourceText, translatedText);
}

function preserveSourceFlags(sourceText, translatedText) {
  const sourceFlags = sourceText.match(/[\u{1F1E6}-\u{1F1FF}]{2}/gu) ?? [];
  if (sourceFlags.length === 0) return translatedText;

  const translatedFlags = translatedText.match(/[\u{1F1E6}-\u{1F1FF}]{2}/gu) ?? [];
  let result = translatedText;

  sourceFlags.forEach((sourceFlag, index) => {
    const translatedFlag = translatedFlags[index];
    if (translatedFlag && translatedFlag !== sourceFlag) {
      result = result.replace(translatedFlag, sourceFlag);
    } else if (!result.includes(sourceFlag)) {
      result = `${result} ${sourceFlag}`;
    }
  });

  return result;
}

function toTsValue(value, indent = 0) {
  const pad = ' '.repeat(indent);
  const nextPad = ' '.repeat(indent + 2);

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return `[\n${value.map((item) => `${nextPad}${toTsValue(item, indent + 2)}`).join(',\n')}\n${pad}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    return `{\n${entries
      .map(([key, entryValue]) => `${nextPad}${JSON.stringify(key)}: ${toTsValue(entryValue, indent + 2)}`)
      .join(',\n')}\n${pad}}`;
  }

  return JSON.stringify(value);
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return fallback;
    }
    throw error;
  }
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function cachePathForLanguage(language) {
  return path.join(CACHE_DIR, `${language}.json`);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
