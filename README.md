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

Google sign-in is implemented with Expo SDK 56 `expo-auth-session` and `expo-web-browser`. The app stores the signed-in Google profile and recent activity history locally with AsyncStorage.

Set the OAuth client IDs before running:

```bash
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=... \
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=... \
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=... \
npm run web
```

The current `google-services.json` was copied from `/Users/vkct/Downloads/google-services(5).json`. It declares Android package `com.vinago.dev`, while this app config uses `com.vinago.plus`; create/update the Firebase Android app and OAuth client for `com.vinago.plus` before relying on native Google sign-in in production builds.

Allow these redirect URIs in Google Cloud Console as needed:

- Web dev: the URL printed by Expo web with `/oauthredirect` appended, for example `http://localhost:8081/oauthredirect`.
- Web production: `https://vinago.aiautotool.com/oauthredirect`.
- Native development build: `vinagoplus:/oauthredirect`.

Itinerary confirmation email works in two modes:

- If `EXPO_PUBLIC_ITINERARY_EMAIL_ENDPOINT` is set, the app posts `{ to, name, itinerary, profile }` to that endpoint with the current Google ID token.
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
- Expo Location plus Google Maps/Places for nearby suggestions
- SQLite city packs for richer offline mode
- Firebase/Supabase for user sync, CMS content, and subscriptions
- EAS Build for app store binaries

## Assets

Local photos are stored in `assets/photos`. Attribution details are listed in `ASSET_CREDITS.md`.
