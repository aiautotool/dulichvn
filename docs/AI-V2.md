# Vinago+ AI v2

Branch: `v2-ai-optimized`

## What changed

The AI layer is now isolated in `src/features/ai/AITravelService.ts` instead of mixing provider logic with travel-domain logic.

### Runtime improvements

- Local-first fallback: the app can answer common Vietnam travel questions without a network request.
- Remote-provider abstraction: any OpenAI-compatible `/chat/completions` provider can be plugged in without changing the travel logic.
- Request de-duplication: identical concurrent questions share one in-flight request.
- Short-lived response cache: repeated questions avoid unnecessary model calls.
- Bounded cache: memory usage is capped at 100 entries.
- Remote timeout: provider calls fail fast and automatically fall back to local answers.
- Low temperature and bounded output tokens for more deterministic travel answers.
- Context-aware prompts using city, selected cities, purpose, trip duration, trip style, places and foods.
- Catalog-first prompting to reduce hallucinated prices, opening hours and other travel facts.
- API-key boundary: provider credentials are designed for server-side use only.

## Architecture

```text
UI
 └─ AITravelService
     ├─ cache
     ├─ in-flight request coalescing
     ├─ remote provider (OpenAI-compatible)
     └─ deterministic local fallback
```

## Provider configuration

Server-side environment variables:

```text
AI_API_BASE_URL=https://api.openai.com/v1
AI_API_KEY=...
AI_MODEL=...
```

Do **not** use `EXPO_PUBLIC_AI_API_KEY`. Expo public environment variables are bundled into the client and are not suitable for secrets.

## Integration contract

```ts
const service = new AITravelService(
  createOpenAICompatibleClient({
    baseUrl: process.env.AI_API_BASE_URL!,
    apiKey: process.env.AI_API_KEY!,
    model: process.env.AI_MODEL!,
  }),
);

const result = await service.answer(question, {
  locale: 'vi',
  currentCity: 'Đà Nẵng',
  selectedCities: ['Đà Nẵng', 'Hội An'],
  purpose: 'Travel',
  tripDays: 3,
  tripStyle: 'Culture + Food',
  places,
  foods,
});
```

The service returns `source: remote | local`, allowing analytics and UI to distinguish model answers from deterministic offline answers.

## Important

The existing `App.tsx` still contains the legacy `buildAiAnswer` prototype. This branch adds the optimized AI service as the new boundary, but does not silently replace the monolithic UI implementation. The next integration step is to route `askAi()` and `createItineraryConfirmation()` through `AITravelService` and expose the provider only from the Cloudflare Worker.
