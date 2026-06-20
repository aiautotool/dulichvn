# Environment Variables

Vinago+ uses Expo's `EXPO_PUBLIC_*` convention for client-side env vars and Cloudflare's secret/var system for Worker env vars.

## Client-side (Expo, baked into the bundle at build time)

All of these are read inside `App.tsx`. They must be set in the shell or in a `.env` file before running `npm run web/ios/android` or `npm run export:web`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_GA_MEASUREMENT_ID` | undefined | Web GA4 Measurement ID (must start with `G-`). When missing, the app queues analytics events to AsyncStorage instead of sending to gtag. |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | fallback to `959396812028-5uedsvgcclv8ngjs97enll5tlmld45oa.apps.googleusercontent.com` | OAuth client for web Google sign-in |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | fallback to `959396812028-kebdshs109pum50s7of7eqe27odlgh3l.apps.googleusercontent.com` | OAuth client for Android Google sign-in |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | falls back to the web client ID, then the embedded web default | OAuth client for iOS Google sign-in |
| `EXPO_PUBLIC_ITINERARY_EMAIL_ENDPOINT` | unset (the app falls back to `expo-mail-composer`) | Absolute or same-origin URL the app POSTs to when emailing an itinerary |

The `.env.example` file lists the same keys with safe placeholder values. Copy it to `.env` and edit:

```bash
cp .env.example .env
```

> **Cloudflare deploy:** `EXPO_PUBLIC_GA_MEASUREMENT_ID` is the one env var you must export before `npm run deploy:cloudflare`, because the value is baked into the static web bundle at build time.

## Cloudflare Worker

Configured in `wrangler.jsonc` and via `wrangler secret`.

| Variable | Type | Where | Purpose |
| --- | --- | --- | --- |
| `ITINERARY_EMAIL_FROM` | var | `wrangler.jsonc` | `From` address used in the Resend call. Default: `Vinago+ <itinerary@aiautotool.com>`. |
| `RESEND_API_KEY` | secret | `wrangler secret put RESEND_API_KEY` | Resend API key. If missing, the Worker returns 503. |
| `ASSETS` | binding | `wrangler.jsonc` | The static-assets binding pointing at `./dist`. |
| `CLOUDFLARE_ACCOUNT_ID` | env | shell (deploy) | Resolved automatically by the global deploy script. |
| `CLOUDFLARE_API_TOKEN` | env | shell (deploy) | Used by `wrangler deploy` for scoped-token auth. |
| `CLOUDFLARE_EMAIL` / `CLOUDFLARE_API_KEY` | env | shell (deploy) | Used by the legacy global-key path (`scripts/deploy-worker.sh`). |

`.env.cloudflare.local` is gitignored and may be used to store `CLOUDFLARE_EMAIL` and `CLOUDFLARE_API_KEY` (or their aliases) for the global-key path:

```bash
# .env.cloudflare.local (gitignored)
CLOUDFLARE_EMAIL=info@aiautotool.com
CLOUDFLARE_API_KEY=...
```

## Cloudflare / DNS

For the global deploy to work end-to-end, the deploy script creates or updates the proxied `AAAA` record for `vinago.aiautotool.com`:

| Field | Value |
| --- | --- |
| Type | AAAA |
| Name | vinago (under `aiautotool.com`) |
| Content | `100::` |
| TTL | 1 (auto) |
| Proxied | true |

If you prefer to manage DNS by hand, create the same record in the Cloudflare dashboard before running `npm run deploy:cloudflare`.

## Reserved env vars (not currently read)

| Name | Status |
| --- | --- |
| `OPENAI_API_KEY` | Planned for the real chat and translation flows. |
| `EXPO_PUBLIC_MAPS_KEY` | Planned for Expo Location + Google Maps. |
| `EXPO_PUBLIC_SQLITE_DB` | Planned for richer offline city packs. |

See [Roadmap](../roadmap.md).
