# Vinago+

Cross-platform Expo MVP for web, iOS, and Android. The app helps foreign visitors discover places, Vietnamese food, culture tips, survival phrases, favorites, and a local-data-first AI chat prototype.

## Run

```bash
npm install
npm run web
npm run ios
npm run android
```

## Verify

```bash
npm run typecheck
```

## Google Analytics

GA4 property metadata is stored in `app.json`:

- Property name: `vinago-e7476`
- Property ID: `542368554`
- Stream ID: `15118007638`

For web tracking, set the GA4 Measurement ID before running or exporting web:

```bash
EXPO_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX npm run web
```

The numeric Stream ID is not the same as the web Measurement ID. Analytics loads only when `EXPO_PUBLIC_GA_MEASUREMENT_ID` starts with `G-`. If the Measurement ID is missing, app analytics events are queued locally with AsyncStorage so the event taxonomy still works on web, iOS, and Android until a native/backend analytics sink is connected.

Tracked app events include:

- `app_opened`, `screen_view`, `tab_opened`
- `onboarding_started`, `onboarding_completed`, `profile_reset`
- `language_selected`, `purpose_selected`, `city_selected`, `trip_days_selected`
- `search_submitted`, `filter_changed`
- `place_opened`, `food_opened`
- `favorite_added`, `favorite_removed`
- `ai_question_submitted`, `itinerary_generated`

Every event includes locale, selected language, current city, purpose, trip days, platform, session ID, GA Property ID, and GA Stream ID where available.

## Google Login, Activity History, And Itinerary Email

Google sign-in is implemented with native Google Sign-In plus Firebase Auth on iOS/Android. The web app signs in by QR approval from the mobile app.

iOS uses the repo-level `GoogleService-Info.plist`. Expo copies it into the native target via `ios.googleServicesFile`, Firebase boots from that plist in `AppDelegate.swift`, and Google Sign-In reads its `CLIENT_ID`/`REVERSED_CLIENT_ID`. Do not set an iOS OAuth env var for Vinago+.

The `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` value is optional for native builds; it is the Firebase server/web OAuth client passed to Google Sign-In so Firebase can mint credentials. It is not the browser login flow. The current `google-services.json` declares Android package `com.vinago.dev`, and `GoogleService-Info.plist` declares iOS bundle `com.vinago.plus`.

QR web login is also available on the Account tab. On web, Vinago+ creates a Worker-backed QR session and polls it. On mobile, sign in with Google, tap "Scan web login QR", and approve the web session with the current Firebase ID token. For local Expo web testing with a real phone, set:

```bash
EXPO_PUBLIC_VINAGO_API_BASE_URL=https://vinago.aiautotool.com npm run web
```

Itinerary confirmation email works in two modes:

- If `EXPO_PUBLIC_ITINERARY_EMAIL_ENDPOINT` is set, the app posts `{ to, name, itinerary, profile }` to that endpoint with the current Firebase ID token.
- If it is unset, the app opens the OS email composer using `expo-mail-composer` with the itinerary prefilled.

The bundled Cloudflare Worker exposes `POST /api/itinerary-email` and sends through Resend. Configure the secret before deploy:

```bash
npx wrangler secret put RESEND_API_KEY
```

`ITINERARY_EMAIL_FROM` defaults to `Vinago+ <itinerary@aiautotool.com>` in `wrangler.jsonc`; update it to a verified Resend sender/domain before production sending.

## Cloudflare Workers Deploy

The web app exports to `dist` and deploys as a Cloudflare Workers static-assets app for:

```txt
https://vinago.aiautotool.com
```

Deploy with a scoped Cloudflare API token:

```bash
CLOUDFLARE_API_TOKEN=... \
EXPO_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX \
npm run deploy:cloudflare
```

If you only have a legacy global API key, avoid saving it in the repo. Use temporary shell variables instead:

```bash
CLOUDFLARE_EMAIL=info@aiautotool.com \
CLOUDFLARE_API_KEY=... \
EXPO_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX \
npm run deploy:cloudflare
```

If Wrangler opens OAuth instead of using the global key, use the guarded deploy script. It resolves account/zone IDs, creates or updates the proxied DNS record, exports the Expo web build, and deploys with the global key passed directly to the Wrangler process:

```bash
export CLOUDFLARE_EMAIL="info@aiautotool.com"
export CLOUDFLARE_API_KEY="..."
npm run deploy:cloudflare:global
```

## MVP Included

- Onboarding: language, purpose, current city, trip days
- Home: search, AI ask box, nearby suggestions, today tips, food and culture highlights
- Explore Vietnam: city/category filters, place list, guide-style place detail, quick AI questions
- Vietnamese Food: food list/detail, allergens, spice level, price, ordering phrase
- Culture Guide: dos/don'ts and AI prompts
- Survival Vietnamese: phrase list, favorites, emergency numbers
- AI Chat: local intent matching for places, food, traffic, temple etiquette, translation, and sample itineraries
- Favorites: local persistence with AsyncStorage

## Next Integrations

- OpenAI API for real chat, translation, and camera guide
- Expo Location plus OpenStreetMap/Places-provider nearby suggestions
- SQLite city packs for richer offline mode
- Firebase/Supabase for user sync, CMS content, and subscriptions
- EAS Build for app store binaries

## Assets

Local photos are stored in `assets/photos`. Attribution details are listed in `ASSET_CREDITS.md`.
