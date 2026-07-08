#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const OUTPUT_PATH = path.join(ROOT, 'src/data/wikimediaPlaces.ts');
const ENDPOINT = 'https://query.wikidata.org/sparql';
const USER_AGENT = 'VinagoPlus/1.0 local Wikimedia place sync';

const MAX_PLACES = Number.parseInt(process.env.WIKIMEDIA_PLACE_LIMIT ?? '360', 10);

const typeGroups = [
  {
    name: 'heritage',
    qids: ['Q9259', 'Q839954', 'Q4989906', 'Q23413', 'Q207694'],
  },
  {
    name: 'culture',
    qids: ['Q33506', 'Q44539', 'Q16970', 'Q24354', 'Q12280', 'Q751876'],
  },
  {
    name: 'nature',
    qids: ['Q46169', 'Q179049', 'Q8502', 'Q40080', 'Q35509', 'Q23397', 'Q23442', 'Q54050'],
  },
  {
    name: 'visitor',
    qids: ['Q570116', 'Q11707', 'Q3947', 'Q1785071', 'Q41176'],
  },
];

const destinationAnchors = [
  ['TP. Hồ Chí Minh', 10.7769, 106.7009],
  ['Hà Nội', 21.0278, 105.8342],
  ['Đà Nẵng', 16.0471, 108.2068],
  ['Hội An', 15.8801, 108.338],
  ['Huế', 16.4637, 107.5909],
  ['Hạ Long', 20.9712, 107.0448],
  ['Nha Trang', 12.2388, 109.1967],
  ['Đà Lạt', 11.9404, 108.4583],
  ['Phú Quốc', 10.2899, 103.984],
  ['Cần Thơ', 10.0452, 105.7469],
  ['Sa Pa', 22.3364, 103.8438],
  ['Ninh Bình', 20.2506, 105.9745],
  ['Phong Nha', 17.6103, 106.3097],
  ['Mũi Né', 10.9333, 108.2833],
  ['Vũng Tàu', 10.4114, 107.1362],
  ['Quy Nhơn', 13.782, 109.219],
  ['Côn Đảo', 8.6864, 106.6082],
  ['Cà Mau', 9.1768, 105.1524],
  ['Buôn Ma Thuột', 12.6662, 108.0382],
  ['Pleiku', 13.9833, 108],
  ['Hà Giang', 22.8233, 104.9836],
  ['Cao Bằng', 22.6667, 106.25],
  ['Điện Biên Phủ', 21.386, 103.023],
  ['Lào Cai', 22.4856, 103.9707],
  ['Đồng Hới', 17.4689, 106.6223],
  ['Phan Thiết', 10.9333, 108.1],
];

const curatedPriority = new Set([
  'Q170320',
  'Q35880',
  'Q1858',
  'Q18809',
  'Q25282',
  'Q1854',
  'Q36399',
  'Q19491',
  'Q25281',
  'Q23513',
  'Q26549',
  'Q26936',
]);

const categoryRules = [
  [/world heritage|di sản|heritage|historic|archaeological|thành cổ|cố đô|imperial/i, 'Di sản'],
  [/museum|bảo tàng/i, 'Bảo tàng'],
  [/temple|pagoda|chùa|đền|miếu|shrine|cathedral|church|nhà thờ/i, 'Tâm linh'],
  [/national park|vườn quốc gia|protected|khu bảo tồn|forest|rừng/i, 'Thiên nhiên'],
  [/mountain|núi|peak|đỉnh/i, 'Núi'],
  [/beach|bãi biển|island|đảo|bay|vịnh|coast/i, 'Biển đảo'],
  [/cave|hang|động/i, 'Hang động'],
  [/lake|hồ|river|sông|waterfall|thác/i, 'Sông hồ'],
  [/market|chợ|shopping/i, 'Chợ'],
  [/bridge|cầu|tower|skyscraper|building|tòa nhà/i, 'Công trình'],
];

function escapeSparqlValues(qids) {
  return qids.map((qid) => `wd:${qid}`).join(' ');
}

function buildQuery(qids) {
  return `
SELECT ?item ?itemLabel ?itemDescription ?coord ?image ?commons ?viArticle ?enArticle (SAMPLE(?typeLabel) AS ?typeLabel) WHERE {
  VALUES ?typeRoot { ${escapeSparqlValues(qids)} }
  ?item wdt:P17 wd:Q881;
        wdt:P625 ?coord;
        wdt:P31/wdt:P279* ?typeRoot;
        wdt:P31 ?type.
  OPTIONAL { ?item wdt:P18 ?image. }
  OPTIONAL { ?item wdt:P373 ?commons. }
  OPTIONAL { ?viArticle schema:about ?item; schema:isPartOf <https://vi.wikipedia.org/>. }
  OPTIONAL { ?enArticle schema:about ?item; schema:isPartOf <https://en.wikipedia.org/>. }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "vi,en".
    ?item rdfs:label ?itemLabel.
    ?item schema:description ?itemDescription.
    ?type rdfs:label ?typeLabel.
  }
}
GROUP BY ?item ?itemLabel ?itemDescription ?coord ?image ?commons ?viArticle ?enArticle
ORDER BY DESC(BOUND(?viArticle)) DESC(BOUND(?enArticle)) DESC(BOUND(?image)) ?itemLabel
LIMIT 220
`;
}

async function fetchGroup(group) {
  const url = `${ENDPOINT}?query=${encodeURIComponent(buildQuery(group.qids))}&format=json`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/sparql-results+json',
      'User-Agent': USER_AGENT,
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Wikidata query failed for ${group.name}: ${response.status} ${text.slice(0, 140)}`);
  }
  const data = JSON.parse(text);
  return data.results.bindings.map((binding) => {
    const row = {};
    for (const [key, value] of Object.entries(binding)) {
      row[key] = value.value;
    }
    row.group = group.name;
    return row;
  });
}

function parsePoint(point) {
  const match = /^Point\\(([-0-9.]+) ([-0-9.]+)\\)$/.exec(point ?? '');
  if (!match) return null;
  return {
    lng: Number.parseFloat(match[1]),
    lat: Number.parseFloat(match[2]),
  };
}

function distanceKm(aLat, aLng, bLat, bLng) {
  const radius = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const a =
    s1 * s1 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      s2 *
      s2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestDestination(lat, lng) {
  let nearest = destinationAnchors[0];
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const anchor of destinationAnchors) {
    const distance = distanceKm(lat, lng, anchor[1], anchor[2]);
    if (distance < nearestDistance) {
      nearest = anchor;
      nearestDistance = distance;
    }
  }
  return nearest[0];
}

function classify(row) {
  const haystack = `${row.typeLabel ?? ''} ${row.itemLabel ?? ''} ${row.itemDescription ?? ''}`;
  return categoryRules.find(([pattern]) => pattern.test(haystack))?.[1] ?? 'Điểm tham quan';
}

function slugify(input) {
  return input
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
}

function wikidataId(itemUrl) {
  return itemUrl?.split('/').pop() ?? '';
}

function score(row) {
  const qid = wikidataId(row.item);
  return (
    (curatedPriority.has(qid) ? 100 : 0) +
    (row.viArticle ? 30 : 0) +
    (row.enArticle ? 18 : 0) +
    (row.image ? 12 : 0) +
    (row.itemDescription ? 5 : 0)
  );
}

function cleanDescription(row, category) {
  if (row.itemDescription && !/^Wikimedia disambiguation page/i.test(row.itemDescription)) {
    return row.itemDescription;
  }
  return `${row.itemLabel} là ${category.toLowerCase()} tại Việt Nam, được bổ sung từ dữ liệu mở Wikimedia.`;
}

function makePlace(row) {
  const point = parsePoint(row.coord);
  if (!point) return null;
  const qid = wikidataId(row.item);
  const category = classify(row);
  const city = nearestDestination(point.lat, point.lng);
  const name = row.itemLabel?.trim();
  if (!name || /^Q\\d+$/.test(name)) return null;
  return {
    id: `wm_${qid.toLowerCase()}_${slugify(name)}`,
    wikidataId: qid,
    name,
    city,
    category,
    description: cleanDescription(row, category),
    history: row.viArticle || row.enArticle
      ? `Nguồn Wikimedia: ${row.viArticle ?? row.enArticle}`
      : `Nguồn Wikimedia: ${row.item}`,
    bestTime: category === 'Biển đảo' ? 'Mùa khô, sáng sớm hoặc chiều muộn' : 'Sáng sớm hoặc chiều muộn',
    ticketPrice: 'Kiểm tra tại điểm đến',
    openHours: 'Kiểm tra trước khi đi',
    lat: Number(point.lat.toFixed(6)),
    lng: Number(point.lng.toFixed(6)),
    tags: [
      category,
      city,
      row.viArticle ? 'Wikipedia tiếng Việt' : 'Wikimedia',
      row.image ? 'Có ảnh Commons' : 'Dữ liệu mở',
    ],
    whyGo: row.itemDescription
      ? `${row.itemDescription}.`
      : `Một điểm ${category.toLowerCase()} đáng lưu lại khi khám phá Việt Nam.`,
    travelTip: row.viArticle || row.enArticle
      ? 'Mở trang Wikipedia/Wikimedia để kiểm tra giờ mở cửa, quy định tham quan và thông tin mới nhất.'
      : 'Kiểm tra thông tin địa phương trước khi đến vì dữ liệu mở có thể chưa đủ giờ mở cửa hoặc giá vé.',
    imageUrl: row.image,
    wikipediaUrl: row.viArticle ?? row.enArticle,
    commonsCategory: row.commons,
    sourceUrl: row.item,
    source: 'Wikimedia',
    score: score(row),
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

const allRows = [];
for (const group of typeGroups) {
  console.log(`Fetching ${group.name}...`);
  try {
    allRows.push(...await fetchGroup(group));
  } catch (error) {
    console.warn(error.message);
  }
}

const dedupedRows = new Map();
for (const row of allRows) {
  const qid = wikidataId(row.item);
  const existing = dedupedRows.get(qid);
  if (!existing || score(row) > score(existing)) {
    dedupedRows.set(qid, row);
  }
}

const places = Array.from(dedupedRows.values())
  .map(makePlace)
  .filter(Boolean)
  .sort((a, b) => b.score - a.score || a.city.localeCompare(b.city, 'vi') || a.name.localeCompare(b.name, 'vi'))
  .slice(0, MAX_PLACES)
  .map(({ score: _score, ...place }) => place);

const header = `/* eslint-disable quote-props */\n// Generated by scripts/sync-wikimedia-places.mjs from Wikidata and Wikimedia Commons.\n// Do not edit entries manually; adjust the sync script or post-processing rules instead.\n\nexport type WikimediaPlaceSeed = {\n  id: string;\n  wikidataId: string;\n  name: string;\n  city: string;\n  category: string;\n  description: string;\n  history: string;\n  bestTime: string;\n  ticketPrice: string;\n  openHours: string;\n  lat: number;\n  lng: number;\n  tags: string[];\n  whyGo: string;\n  travelTip: string;\n  imageUrl?: string;\n  wikipediaUrl?: string;\n  commonsCategory?: string;\n  sourceUrl: string;\n  source: 'Wikimedia';\n};\n\n`;

await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
await fs.writeFile(
  OUTPUT_PATH,
  `${header}export const wikimediaPlaces = ${toTsValue(places)} satisfies WikimediaPlaceSeed[];\n`,
);

const byCity = places.reduce((acc, place) => {
  acc[place.city] = (acc[place.city] ?? 0) + 1;
  return acc;
}, {});

console.log(`Wrote ${places.length} places to ${path.relative(ROOT, OUTPUT_PATH)}`);
console.log(byCity);
