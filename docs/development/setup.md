# Local Setup

This page walks through getting the app running on web, iOS, and Android locally.

## Prerequisites

- Node.js (any version supported by Expo SDK 56; see `https://docs.expo.dev/versions/v56.0.0/`).
- npm (bundled with Node).
- For iOS: macOS with Xcode and CocoaPods.
- For Android: Android Studio + an Android emulator or a physical device.
- A Cloudflare account (only required for deployment or for testing the email endpoint).
- A Firebase/Google Cloud project with Google sign-in enabled. iOS uses `GoogleService-Info.plist`; web sign-in is approved by QR from the mobile app.

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
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Optional Firebase server/web client for native Google Sign-In |
| `EXPO_PUBLIC_VINAGO_API_BASE_URL` | QR web login when a physical phone needs to reach the Worker |
| `EXPO_PUBLIC_ITINERARY_EMAIL_ENDPOINT` | Cloudflare Worker email (defaults to `/api/itinerary-email` if omitted) |

iOS does not use `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`. It reads `CLIENT_ID` and `REVERSED_CLIENT_ID` from `GoogleService-Info.plist` after `npx expo prebuild --platform ios`.

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

1. On a mobile build, sign in with Google through Firebase Auth. On web, open the Account tab and scan its QR code from the signed-in mobile app.
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
| Google sign-in opens nothing on iOS | Rebuild after prebuild so `ios/Vinago/GoogleService-Info.plist` and the reversed client URL scheme are inside the native app |
| Analytics events do not show up on the dashboard | Web only fires through `gtag` when `EXPO_PUBLIC_GA_MEASUREMENT_ID` starts with `G-`; on native or unconfigured web, events are queued to AsyncStorage (see [Google Analytics](../integrations/google-analytics.md)) |
| Native build fails with `google-services.json` package mismatch | The bundled file is for `com.vinago.dev`; see [Native Builds](./native-builds.md) for the steps to fix this |
