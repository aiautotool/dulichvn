# Roadmap

The MVP in this repo is a local-data-first travel companion. The "next integrations" list comes from `README.md`; the longer-term product vision lives in `docs/product-blueprint.md`. This page merges both into one engineering checklist.

## Implemented (MVP)

- Onboarding: language, purpose, city, trip days.
- Home, Explore, Food, Culture, Phrases, AI, Favorites, Profile screens.
- Local persistence (AsyncStorage) for profile, favorites, auth session, activity history, analytics queue.
- Google sign-in via `expo-auth-session` (web + native).
- GA4 event taxonomy with gtag on web and AsyncStorage queue on native / unconfigured web.
- Itinerary generation (local deterministic answer).
- Itinerary email via Cloudflare Worker + Resend, with OS composer fallback.
- Static-assets deploy to `vinago.aiautotool.com` via Wrangler.

## Next Integrations (per `README.md`)

- **OpenAI API** for real chat, translation, and camera guide.
- **Expo Location + Google Maps / Places** for nearby suggestions.
- **SQLite city packs** for richer offline data.

## Engineering Backlog

### AI / Content

- Replace `buildAiAnswer` with a real model call. The current matcher is great as a deterministic fallback; pair it with an LLM that respects the system prompt and the user's selected language.
- Wire the queued AsyncStorage events to a server-side endpoint so native analytics can drain.
- Add per-locale content for `places` and `foods` (see [Localization](./localization.md)).
- Translate `phrases.pronunciation` into other scripts (Hanja, Kana, etc.).
- Add voice output (TTS) to the phrase cards; the buttons exist, the audio is not wired.

### Maps & Location

- Add `expo-location` and request foreground permission on Explore / AI tabs.
- Render the `lat` / `lng` values from the `places` catalog on a map preview inside the place detail.
- Use the Google Places API to enrich or replace the local `places` catalog.
- Provide real "Nearby with GPS" recommendations (currently a locked module placeholder).

### Camera & Vision

- Implement the "AI Camera Guide" locked module: capture, send to OpenAI Vision, get a translation / dish recognition / menu read.
- Add a manual mode for the camera guide (e.g. for accessibility).

### Voice

- Add Speech-to-Text for spoken questions on the AI tab.
- Add real-time translation as a locked-module upgrade.

### Backend

- Add a FastAPI (or similar) backend that:
  - Receives drained analytics events and forwards them server-side.
  - Hosts a CMS for translating content.
  - Proxies OpenAI calls with rate limits and per-user quotas.
- Verify Google ID tokens in the Worker against Google's JWKS (see [Itinerary Email → Security Notes](./integrations/itinerary-email.md)).
- Add rate limiting to `/api/itinerary-email` (Cloudflare Turnstile or rate-limit rules).

### Mobile

- Add `GoogleService-Info.plist` for iOS and re-issue `google-services.json` for `com.vinago.plus` (see [Native Builds](./development/native-builds.md)).
- Wire a native analytics SDK (Firebase Analytics or `@react-native-firebase/analytics`) for native event reporting.
- Add iOS / Android unit tests; right now there are no test files.
- Add E2E tests with Detox or Maestro for the onboarding and itinerary flows.

### Web

- Add a service worker for offline support (the app already persists state, but the JS bundle must be cached).
- Add a "share itinerary" button that copies a public link (requires a backend endpoint).
- Add server-side rendering or pre-rendering for the marketing pages around `vinago.aiautotool.com`.

### Premium / Paywall

- Wire a payment provider (Stripe / App Store / Google Play) to unlock the four locked modules.
- Add a "trial" state for first-time users so they can see the value before the paywall.
- Add analytics for `paywall_viewed`, `subscription_started`, `subscription_cancelled` so the GA4 dashboards can include revenue.

### Product Vision (`docs/product-blueprint.md` highlights)

- Expand languages to the full list in the product blueprint (10+ locales, 70% / 100% coverage tiers).
- Add per-locale SEO pages on the web app.
- Build a CMS workflow for editors: source content → AI translation → human review → publish per locale.
- Add a notification system (push, email, in-app) that respects the user's locale.

## Open Questions

- Should `google-services.json` for `com.vinago.dev` be deleted now that we ship `com.vinago.plus`?
- Is the Worker deployment model (DNS AAAA `100::` + Wrangler custom domain) durable for multi-region failover, or do we need a load balancer in front?
- How do we handle quota for the email endpoint? Per Google account? Per IP? Per Worker invocation?
- Do we want to add a small "demo" / "sandbox" mode for press and partners?
