export type AITravelLocale = 'vi' | 'en' | string;

export type AITravelPlace = {
  id: string;
  name: string;
  city: string;
  category?: string;
  description?: string;
  bestTime?: string;
  travelTip?: string;
  tags?: string[];
};

export type AITravelFood = {
  id: string;
  name: string;
  englishName?: string;
  region?: string;
  spicyLevel?: number;
  priceRange?: string;
  howToOrder?: string;
};

export type AITravelContext = {
  locale: AITravelLocale;
  currentCity?: string;
  selectedCities?: string[];
  purpose?: string;
  tripDays?: number;
  tripStyle?: string;
  places?: AITravelPlace[];
  foods?: AITravelFood[];
};

export type AITravelResponse = {
  text: string;
  source: 'remote' | 'local';
  model?: string;
  cached: boolean;
  latencyMs: number;
};

export type AITravelRemoteClient = {
  complete(input: {
    messages: Array<{ role: 'system' | 'user'; content: string }>;
    temperature?: number;
    maxTokens?: number;
    signal?: AbortSignal;
  }): Promise<{ text: string; model?: string }>;
};

type CacheEntry = {
  expiresAt: number;
  response: Omit<AITravelResponse, 'cached' | 'latencyMs'>;
};

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_TIMEOUT_MS = 12_000;
const MAX_CACHE_ENTRIES = 100;

export class AITravelService {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly inFlight = new Map<string, Promise<AITravelResponse>>();

  constructor(
    private readonly remoteClient?: AITravelRemoteClient,
    private readonly options: {
      cacheTtlMs?: number;
      timeoutMs?: number;
    } = {},
  ) {}

  async answer(question: string, context: AITravelContext): Promise<AITravelResponse> {
    const normalizedQuestion = normalizeQuestion(question);
    const startedAt = Date.now();
    if (!normalizedQuestion) {
      return {
        text: context.locale === 'vi' ? 'Bạn muốn hỏi gì về chuyến đi?' : 'What would you like to know about your trip?',
        source: 'local',
        cached: false,
        latencyMs: Date.now() - startedAt,
      };
    }

    const cacheKey = buildCacheKey(normalizedQuestion, context);
    const cached = this.getCached(cacheKey);
    if (cached) {
      return { ...cached, cached: true, latencyMs: Date.now() - startedAt };
    }

    const existing = this.inFlight.get(cacheKey);
    if (existing) return existing;

    const task = this.answerUncached(normalizedQuestion, context, cacheKey, startedAt);
    this.inFlight.set(cacheKey, task);
    try {
      return await task;
    } finally {
      this.inFlight.delete(cacheKey);
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  private async answerUncached(
    question: string,
    context: AITravelContext,
    cacheKey: string,
    startedAt: number,
  ): Promise<AITravelResponse> {
    if (this.remoteClient) {
      try {
        const remote = await withTimeout(
          this.remoteClient.complete({
            messages: buildRemoteMessages(question, context),
            temperature: 0.2,
            maxTokens: 700,
          }),
          this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        );
        const text = remote.text.trim();
        if (text) {
          const response = {
            text,
            source: 'remote' as const,
            model: remote.model,
          };
          this.setCached(cacheKey, response);
          return { ...response, cached: false, latencyMs: Date.now() - startedAt };
        }
      } catch {
        // Remote AI is an enhancement. Fall through to deterministic local answers.
      }
    }

    const text = buildLocalAnswer(question, context);
    const response = { text, source: 'local' as const };
    this.setCached(cacheKey, response);
    return { ...response, cached: false, latencyMs: Date.now() - startedAt };
  }

  private getCached(key: string): Omit<AITravelResponse, 'cached' | 'latencyMs'> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return entry.response;
  }

  private setCached(key: string, response: Omit<AITravelResponse, 'cached' | 'latencyMs'>): void {
    if (this.cache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, {
      expiresAt: Date.now() + (this.options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS),
      response,
    });
  }
}

export function createOpenAICompatibleClient(config: {
  baseUrl: string;
  apiKey: string;
  model: string;
}): AITravelRemoteClient {
  const endpoint = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;

  return {
    async complete({ messages, temperature, maxTokens, signal }) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`AI provider returned HTTP ${response.status}`);
      }

      const payload = (await response.json()) as {
        model?: string;
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = payload.choices?.[0]?.message?.content?.trim() ?? '';
      if (!text) throw new Error('AI provider returned an empty response');
      return { text, model: payload.model ?? config.model };
    },
  };
}

function buildRemoteMessages(question: string, context: AITravelContext) {
  const localeInstruction = context.locale === 'vi'
    ? 'Trả lời bằng tiếng Việt tự nhiên, ngắn gọn và thực tế.'
    : 'Answer in natural English, concise and practical.';

  const contextJson = JSON.stringify({
    currentCity: context.currentCity,
    selectedCities: context.selectedCities,
    purpose: context.purpose,
    tripDays: context.tripDays,
    tripStyle: context.tripStyle,
    places: context.places?.slice(0, 30),
    foods: context.foods?.slice(0, 30),
  });

  return [
    {
      role: 'system' as const,
      content: [
        'You are Vinago+ AI, a Vietnam travel assistant.',
        localeInstruction,
        'Prefer supplied local catalog facts over guesses.',
        'Never invent opening hours, prices, safety facts, or availability when they are not provided.',
        'If current or live information is required, say that it needs a live source.',
        'Give actionable recommendations and clearly separate known facts from suggestions.',
        `Traveler context: ${contextJson}`,
      ].join('\n'),
    },
    { role: 'user' as const, content: question },
  ];
}

function buildLocalAnswer(question: string, context: AITravelContext): string {
  const normalized = normalizeQuestion(question);
  const place = context.places?.find((item) => {
    const haystack = normalizeQuestion(`${item.name} ${item.city} ${item.category ?? ''} ${(item.tags ?? []).join(' ')}`);
    return normalized.includes(normalizeQuestion(item.name)) || (normalized.length >= 3 && haystack.includes(normalized));
  });

  if (place) {
    if (context.locale === 'vi') {
      return `${place.name} ở ${place.city}. ${place.description ?? ''}${place.bestTime ? ` Thời điểm nên đi: ${place.bestTime}.` : ''}${place.travelTip ? ` Mẹo: ${place.travelTip}` : ''}`.trim();
    }
    return `${place.name} is in ${place.city}. ${place.description ?? ''}${place.bestTime ? ` Best time: ${place.bestTime}.` : ''}${place.travelTip ? ` Tip: ${place.travelTip}` : ''}`.trim();
  }

  const food = context.foods?.find((item) => {
    const haystack = normalizeQuestion(`${item.name} ${item.englishName ?? ''} ${item.region ?? ''}`);
    return normalized.includes(normalizeQuestion(item.name)) || (normalized.length >= 3 && haystack.includes(normalized));
  });

  if (food) {
    const spice = food.spicyLevel === undefined ? '' : food.spicyLevel === 0 ? ' không cay' : food.spicyLevel === 1 ? ' cay nhẹ' : ' khá cay';
    if (context.locale === 'vi') {
      return `${food.name}${spice}${food.priceRange ? `, khoảng ${food.priceRange}` : ''}.${food.howToOrder ? ` Bạn có thể gọi: ${food.howToOrder}.` : ''}`;
    }
    return `${food.name}${food.spicyLevel !== undefined ? ` is ${food.spicyLevel === 0 ? 'not spicy' : food.spicyLevel === 1 ? 'mild' : 'spicy'}` : ''}${food.priceRange ? `, around ${food.priceRange}` : ''}.${food.howToOrder ? ` You can order: ${food.howToOrder}.` : ''}`;
  }

  if (/(qua duong|cross|traffic|street)/.test(normalized)) {
    return context.locale === 'vi'
      ? 'Khi qua đường, đi chậm và đều, quan sát xe máy từ nhiều hướng và tránh dừng đột ngột giữa dòng xe.'
      : 'When crossing a street, walk slowly and steadily, watch for motorbikes from multiple directions, and avoid stopping suddenly.';
  }

  if (/(chua|temple|pagoda)/.test(normalized)) {
    return context.locale === 'vi'
      ? 'Khi vào chùa, nên mặc lịch sự, nói nhỏ và tôn trọng khu vực thờ cúng.'
      : 'At temples, dress modestly, speak softly, and respect worship areas.';
  }

  if (/(lich trinh|itinerary|plan|ke hoach)/.test(normalized)) {
    const days = context.tripDays ?? 2;
    const cities = context.selectedCities?.join(', ') || context.currentCity || 'Vietnam';
    return context.locale === 'vi'
      ? `Gợi ý nhanh ${days} ngày tại ${cities}: ngày đầu khám phá trung tâm và món địa phương; ngày tiếp theo ưu tiên văn hóa, thiên nhiên và trải nghiệm theo sở thích ${context.tripStyle ?? 'Travel'}.`
      : `Quick ${days}-day suggestion for ${cities}: spend the first day on the city center and local food; use the next days for culture, nature and experiences matching your ${context.tripStyle ?? 'Travel'} style.`;
  }

  return context.locale === 'vi'
    ? 'Tôi có thể giúp bạn về địa điểm, món ăn, văn hóa, cách đi lại và lịch trình ở Việt Nam. Hãy hỏi cụ thể thành phố hoặc trải nghiệm bạn muốn.'
    : 'I can help with places, food, culture, transport and itineraries in Vietnam. Tell me the city or experience you are interested in.';
}

function normalizeQuestion(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ');
}

function buildCacheKey(question: string, context: AITravelContext): string {
  return JSON.stringify([
    question,
    context.locale,
    context.currentCity,
    context.selectedCities,
    context.purpose,
    context.tripDays,
    context.tripStyle,
  ]);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('AI request timed out')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
