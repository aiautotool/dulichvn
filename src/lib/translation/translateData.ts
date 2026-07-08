import { translateText } from './translator';

const TRANSLATABLE_KEYS = new Set([
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

const TECHNICAL_KEYS = new Set([
  'amount',
  'code',
  'createdAt',
  'currency',
  'email',
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
  'publishedAt',
  'rating',
  'score',
  'slug',
  'sortOrder',
  'sourceUrl',
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
  'wikipediaUrl',
]);

export async function translateObject<T>(data: T, targetLanguage: string): Promise<T> {
  return translateValue(data, targetLanguage, undefined, true) as Promise<T>;
}

export async function translateArray<T>(data: T[], targetLanguage: string): Promise<T[]> {
  return translateValue(data, targetLanguage, undefined, true) as Promise<T[]>;
}

async function translateValue(
  value: unknown,
  targetLanguage: string,
  key: string | undefined,
  forceTranslateString: boolean,
): Promise<unknown> {
  if (typeof value === 'string') {
    if (forceTranslateString || (key ? shouldTranslateKey(key) : false)) {
      return translateText(value, targetLanguage);
    }
    return value;
  }

  if (Array.isArray(value)) {
    const shouldTranslateItems = key ? shouldTranslateKey(key) : forceTranslateString;
    return Promise.all(
      value.map((item) => translateValue(item, targetLanguage, key, shouldTranslateItems)),
    );
  }

  if (!value || typeof value !== 'object') return value;

  const entries = Object.entries(value as Record<string, unknown>);
  const translatedEntries = await Promise.all(
    entries.map(async ([entryKey, entryValue]): Promise<[string, unknown]> => {
      if (TECHNICAL_KEYS.has(entryKey)) {
        return [entryKey, entryValue];
      }

      return [
        entryKey,
        await translateValue(entryValue, targetLanguage, entryKey, shouldTranslateKey(entryKey)),
      ];
    }),
  );

  return Object.fromEntries(translatedEntries);
}

function shouldTranslateKey(key: string) {
  return TRANSLATABLE_KEYS.has(key);
}
