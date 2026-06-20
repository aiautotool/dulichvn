# Local Setup

This page walks through getting the app running on web, iOS, and Android locally.

## Prerequisites

- Node.js (any version supported by Expo SDK 56; see `https://docs.expo.dev/versions/v56.0.0/`).
- npm (bundled with Node).
- For iOS: macOS with Xcode and CocoaPods.
- For Android: Android Studio + an Android emulator or a physical device.
- A Cloudflare account (only required for deployment or for testing the email endpoint).
- A Google Cloud project with OAuth clients for web, Android, and iOS (only required for testing Google sign-in).

## Install

```bash
git clone <this-repo>
cd dulichvn
npm install
```

`package.json` declares the Expo SDK 56 dependency tree. There is no `package-lock.json` patch step required.

## Configure

Copy the example env file and edit it:

```bash
cp .env.example .env
```

Set the values you need:

| Key | Required for |
| --- | --- |
| `EXPO_PUBLIC_GA_MEASUREMENT_ID` | Web analytics (must start with `G-`) |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google sign-in on web |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Google sign-in on Android |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Google sign-in on iOS |
| `EXPO_PUBLIC_ITINERARY_EMAIL_ENDPOINT` | Cloudflare Worker email (defaults to `/api/itinerary-email` if omitted) |

If you skip the OAuth env vars, the app falls back to the Firebase client IDs embedded in `App.tsx` and the `google-services.json` shipped in the repo. Those are useful for development; see [Google Auth](../integrations/google-auth.md) for the production checklist.

## Run

```bash
npm run web       # http://localhost:8081
npm run ios       # iOS simulator (macOS only)
npm run android   # Android emulator / connected device
```

The `web` script boots Metro in a browser tab. Hot reload is on by default.

## Verify

```bash
npm run typecheck
```

This runs `tsc --noEmit` against the Expo base config plus `@cloudflare/workers-types` (so the Worker code type-checks too).

## Try the AI tab

Ask the AI anything that matches the in-app catalogs, e.g.:

- "Tell me about Ben Thanh Market"
- "Is bun bo Hue spicy?"
- "How do I cross the street in Ho Chi Minh City?"
- "Plan a 3 day Culture + Food trip in Da Nang"

The answer is computed locally by `buildAiAnswer` in `App.tsx`. There is no network call.

## Try the email flow

1. Sign in with Google (the OAuth client must be configured for the redirect URI Metro prints, e.g. `http://localhost:8081/oauthredirect`).
2. Open the AI tab and tap "Generate itinerary".
3. Tap "Email confirmation". If `EXPO_PUBLIC_ITINERARY_EMAIL_ENDPOINT` is unset, the OS email composer opens. If it is set to a URL you can reach, the request is sent to that URL.
4. For end-to-end testing of the Worker, see [Cloudflare Worker](../integrations/cloudflare-worker.md) and the [Wrangler dev docs](https://developers.cloudflare.com/workers/wrangler/commands/#dev).

## Resetting local state

The app's AsyncStorage keys are scoped to the bundle id. To reset everything during development:

- Web: open the browser DevTools → Application → IndexedDB / Local Storage, find the Metro storage, and clear it. (Or hard-reload after deleting the bundle.)
- iOS simulator: `xcrun simctl uninstall booted com.vinago.plus`.
- Android emulator: `adb uninstall com.vinago.plus`.

You can also use the in-app "Language" button in the top bar to reset just the profile.

## Project scripts

| Script | What it does |
| --- | --- |
| `npm run web` | Start the Metro dev server and open the web app |
| `npm run ios` | Build and run the iOS app on the simulator |
| `npm run android` | Build and run the Android app on the emulator |
| `npm run typecheck` | `tsc --noEmit` against the project |
| `npm run export:web` | Export the web bundle to `dist/` |
| `npm run deploy:cloudflare` | `wrangler deploy --config wrangler.jsonc` (scoped token) |
| `npm run deploy:cloudflare:global` | Run the guarded global-key deploy script |

## Common first-run issues

| Symptom | Fix |
| --- | --- |
| Metro complains about TypeScript errors | `npm run typecheck` to see them; the dev server will still run unless errors are fatal |
| `expo-web-browser` errors on iOS simulator | Sign-in requires a real device or a custom URL scheme registered in the simulator's `Info.plist`. The bundled `app.json` declares `scheme: vinagoplus`; prebuild is required |
| Google sign-in returns `redirect_uri_mismatch` | Add `http://localhost:8081/oauthredirect` (dev) or your production URL to the OAuth client |
| Analytics events do not show up on the dashboard | Web only fires through `gtag` when `EXPO_PUBLIC_GA_MEASUREMENT_ID` starts with `G-`; on native or unconfigured web, events are queued to AsyncStorage (see [Google Analytics](../integrations/google-analytics.md)) |
| Native build fails with `google-services.json` package mismatch | The bundled file is for `com.vinago.dev`; see [Native Builds](./native-builds.md) for the steps to fix this |
