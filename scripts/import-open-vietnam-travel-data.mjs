#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const DEFAULT_INPUT_DIR = '/Users/vkct/Downloads/open-vietnam-travel-data-builder/output';
const inputDir = path.resolve(process.argv[2] ?? DEFAULT_INPUT_DIR);
const inputPath = path.join(inputDir, 'vietnam_places.json');
const outputPath = path.join(ROOT, 'src/data/wikimediaPlaces.ts');
const maxPlaces = Number.parseInt(process.env.OPEN_VIETNAM_PLACE_LIMIT ?? '600', 10);

const destinationCityMap = {
  'can-tho': 'Cần Thơ',
  'da-lat': 'Đà Lạt',
  'da-nang': 'Đà Nẵng',
  'dong-hoi': 'Quảng Bình',
  'ha-giang': 'Hà Giang',
  'ha-long': 'Hạ Long',
  hanoi: 'Hà Nội',
  'ho-chi-minh-city': 'TP. Hồ Chí Minh',
  'hoi-an': 'Hội An',
  hue: 'Huế',
  'nha-trang': 'Nha Trang',
  'ninh-binh': 'Ninh Bình',
  'phan-thiet': 'Mũi Né',
  'phu-quoc': 'Phú Quốc',
  'quy-nhon': 'Quy Nhơn',
  'sa-pa': 'Sa Pa',
  'vung-tau': 'Vũng Tàu',
};

const categoryRules = [
  [/cathedral|church|nhà thờ|basilica/i, 'Nhà thờ'],
  [/pagoda|temple|chùa|đền|miếu|shrine/i, 'Tâm linh'],
  [/museum|bảo tàng/i, 'Bảo tàng'],
  [/market|chợ/i, 'Chợ'],
  [/beach|bay|island|coast|vịnh|biển|đảo|mũi/i, 'Biển đảo'],
  [/mountain|peak|pass|núi|đèo/i, 'Núi'],
  [/lake|river|waterfall|hồ|sông|thác|suối/i, 'Sông hồ'],
  [/cave|hang|động/i, 'Hang động'],
  [/palace|citadel|fort|thành|dinh|cung điện/i, 'Di tích'],
  [/park|garden|reserve|vườn|công viên|khu bảo tồn/i, 'Thiên nhiên'],
  [/bridge|tower|building|cầu|tháp|tòa nhà/i, 'Công trình'],
  [/village|làng/i, 'Làng nghề'],
];

const destinationSortOrder = Object.keys(destinationCityMap);

function slugify(input) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 72);
}

function classify(place) {
  const haystack = `${place.name ?? ''} ${place.description ?? ''}`;
  return categoryRules.find(([pattern]) => pattern.test(haystack))?.[1] ?? 'Điểm tham quan';
}

function normalizeUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  return value.trim().replace(/^http:\/\//i, 'https://');
}

function normalizeDescription(place, category) {
  const description = typeof place.description === 'string' ? place.description.trim() : '';
  if (description && !/^wikimedia disambiguation page/i.test(description)) return description;
  return `${place.name} là ${category.toLowerCase()} tại Việt Nam, được bổ sung từ dữ liệu mở Wikimedia.`;
}

function bestTimeFor(category) {
  if (category === 'Biển đảo') return 'Mùa khô, sáng sớm hoặc chiều muộn';
  if (category === 'Núi') return 'Ngày trời quang, sáng sớm';
  if (category === 'Chợ') return 'Buổi sáng';
  return 'Sáng sớm hoặc chiều muộn';
}

function score(place) {
  return (
    (place.wikipedia_url ? 30 : 0) +
    (place.image ? 20 : 0) +
    (Array.isArray(place.images) && place.images.length > 0 ? 10 : 0) +
    (place.description ? Math.min(String(place.description).length, 240) / 24 : 0)
  );
}

function toSeed(place) {
  const name = typeof place.name === 'string' ? place.name.trim() : '';
  const wikidataId = typeof place.id === 'string' ? place.id.trim() : '';
  const lat = Number(place.coordinates?.lat);
  const lng = Number(place.coordinates?.lon);
  if (!name || !wikidataId || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const city = destinationCityMap[place.destination_id] ?? 'Other';
  const category = classify(place);
  const description = normalizeDescription(place, category);
  const imageUrl = normalizeUrl(place.image ?? place.images?.[0]?.url);
  const wikipediaUrl = normalizeUrl(place.wikipedia_url);

  return {
    id: `wm_${wikidataId.toLowerCase()}_${slugify(name)}`,
    wikidataId,
    name,
    city,
    category,
    description,
    history: wikipediaUrl
      ? `Nguồn mở Wikimedia/Wikipedia: ${wikipediaUrl}`
      : `Nguồn mở Wikidata: https://www.wikidata.org/wiki/${wikidataId}`,
    bestTime: bestTimeFor(category),
    ticketPrice: 'Kiểm tra tại điểm đến',
    openHours: 'Kiểm tra trước khi đi',
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    tags: [
      category,
      city,
      'Dữ liệu mở',
      imageUrl ? 'Có ảnh Wikimedia' : 'Wikimedia',
    ],
    whyGo: `${description.replace(/[.。]+$/u, '')}.`,
    travelTip: 'Dữ liệu được tổng hợp từ nguồn mở; hãy kiểm tra giờ mở cửa và giá vé mới nhất trước khi đi.',
    imageUrl,
    wikipediaUrl,
    sourceUrl: `https://www.wikidata.org/wiki/${wikidataId}`,
    source: 'Wikimedia',
    score: score(place),
    destinationId: place.destination_id ?? '',
  };
}

function toTsValue(value, indent = 0) {
  const pad = ' '.repeat(indent);
  const nextPad = ' '.repeat(indent + 2);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return `[\n${value.map((item) => `${nextPad}${toTsValue(item, indent + 2)}`).join(',\n')}\n${pad}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== '');
    if (entries.length === 0) return '{}';
    return `{\n${entries
      .map(([key, entryValue]) => `${nextPad}${JSON.stringify(key)}: ${toTsValue(entryValue, indent + 2)}`)
      .join(',\n')}\n${pad}}`;
  }
  return JSON.stringify(value);
}

const rawPlaces = JSON.parse(await fs.readFile(inputPath, 'utf8'));
if (!Array.isArray(rawPlaces)) {
  throw new Error(`${inputPath} must contain a JSON array.`);
}

const deduped = new Map();
for (const place of rawPlaces) {
  const seed = toSeed(place);
  if (!seed) continue;
  const existing = deduped.get(seed.wikidataId);
  if (!existing || seed.score > existing.score) {
    deduped.set(seed.wikidataId, seed);
  }
}

const seeds = Array.from(deduped.values())
  .sort((left, right) => {
    const leftDestinationIndex = destinationSortOrder.indexOf(left.destinationId);
    const rightDestinationIndex = destinationSortOrder.indexOf(right.destinationId);
    return (
      (leftDestinationIndex === -1 ? 999 : leftDestinationIndex) -
        (rightDestinationIndex === -1 ? 999 : rightDestinationIndex) ||
      right.score - left.score ||
      left.name.localeCompare(right.name, 'vi')
    );
  })
  .slice(0, maxPlaces)
  .map(({ score: _score, destinationId: _destinationId, ...seed }) => seed);

const header = `/* eslint-disable quote-props */\n// Generated by scripts/import-open-vietnam-travel-data.mjs from open-vietnam-travel-data-builder output.\n// Do not edit entries manually; regenerate from the source JSON instead.\n\nexport type WikimediaPlaceSeed = {\n  id: string;\n  wikidataId: string;\n  name: string;\n  city: string;\n  category: string;\n  description: string;\n  history: string;\n  bestTime: string;\n  ticketPrice: string;\n  openHours: string;\n  lat: number;\n  lng: number;\n  tags: string[];\n  whyGo: string;\n  travelTip: string;\n  imageUrl?: string;\n  wikipediaUrl?: string;\n  sourceUrl: string;\n  source: 'Wikimedia';\n};\n\n`;

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(
  outputPath,
  `${header}export const wikimediaPlaces = ${toTsValue(seeds)} satisfies WikimediaPlaceSeed[];\n`,
);

const byCity = seeds.reduce((acc, place) => {
  acc[place.city] = (acc[place.city] ?? 0) + 1;
  return acc;
}, {});

console.log(`Imported ${seeds.length} places from ${inputPath}`);
console.log(`Wrote ${path.relative(ROOT, outputPath)}`);
console.log(byCity);
