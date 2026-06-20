# Vinago+ Documentation

Welcome to the **Vinago+** project documentation. This folder is the canonical, code-level description of what the app does, how it is built, and how it is deployed.

> **Source of truth.** The current code in this repository (`App.tsx`, `src/worker.ts`, `app.json`, `wrangler.jsonc`, `scripts/`) is authoritative. The documents below mirror that code; when the two disagree, the code wins and the docs need updating.

## Project at a Glance

- **Name / slug:** Vinago+ / `vinago-plus`
- **Version:** 1.0.0
- **Scheme (deep link):** `vinagoplus`
- **Platforms:** Expo SDK 56 web (Metro), iOS, Android
- **Stack:** React Native (Expo), TypeScript, AsyncStorage, `expo-auth-session` (Google), `expo-mail-composer`, GA4, Cloudflare Workers + static assets, Resend
- **Primary domain:** `vinago.aiautotool.com` (proxied via Cloudflare)
- **GA4 property:** `vinago-e7476` (property `542368554`, stream `15118007638`)
- **Design tokens:** red/white palette, 4-tab bottom nav, 220 i18n keys, 2 locales (EN/VI)

## How to Read These Docs

| If you want to… | Start here |
| --- | --- |
| Get the app running locally | [Development → Setup](./development/setup.md) |
| Understand the screens and flows | [App Overview](./app-overview.md) → individual feature pages under [Features](./features/) |
| See every TypeScript domain type and content catalog | [Data Models](./data-models.md) |
| See how Google sign-in, analytics, email, and the Worker fit together | [Integrations](./integrations/) |
| Deploy to Cloudflare | [Deployment → Cloudflare](./deployment/cloudflare.md) |
| Configure environment variables | [Development → Environment Variables](./development/environment-variables.md) |
| Build native iOS / Android | [Development → Native Builds](./development/native-builds.md) |
| Translate or add languages | [Localization](./localization.md) |
| See the planned future work | [Roadmap](./roadmap.md) |

## Top-Level Map

```
docs/
├── README.md                       # this index
├── app-overview.md                 # screen-by-screen walkthrough
├── architecture.md                 # system architecture and request flow
├── data-models.md                  # TypeScript types + content catalogs
├── localization.md                 # translation table, locale strategy
├── assets.md                       # bundled images and credit metadata
├── roadmap.md                      # next integrations and product milestones
│
├── features/
│   ├── onboarding.md               # welcome + language chooser
│   ├── home.md                     # home / explore
│   ├── place-detail.md             # place detail
│   ├── food.md                     # food list + detail
│   ├── culture.md                  # dos/don'ts cards
│   ├── phrases-and-emergency.md    # phrases + emergency numbers
│   ├── ai-and-itinerary.md         # AI chat + itinerary builder + PDF preview
│   ├── favorites.md                # saved items
│   ├── history.md                  # activity log
│   ├── account.md                  # account / sign-in
│   ├── search.md                   # full search with recent + suggestions
│   ├── filter.md                   # filter modal sheet
│   ├── map.md                      # map view (placeholder + open in Maps)
│   ├── offline.md                  # offline mode screen + banner
│   ├── settings.md                 # settings (theme, units, font, etc.)
│   └── language-support.md         # language picker screen
│
├── integrations/
│   ├── google-auth.md              # expo-auth-session + Google identity
│   ├── google-analytics.md         # gtag + AsyncStorage event queue
│   ├── itinerary-email.md         # Resend via Cloudflare Worker
│   └── cloudflare-worker.md        # Worker runtime, types, secrets
│
├── deployment/
│   └── cloudflare.md               # Wrangler, DNS, and the two deploy scripts
│
└── development/
    ├── setup.md                    # npm install + npm run web/ios/android
    ├── environment-variables.md    # all EXPO_PUBLIC_* keys
    └── native-builds.md            # iOS / Android prebuild notes
```

## Repository Quick Map

```
/
├── App.tsx                         # entire React Native app (single file, 5,172 lines)
├── index.ts                        # Expo registerRootComponent bootstrap
├── app.json                        # Expo config (slug, scheme, icons, plugins)
├── package.json                    # scripts: web, ios, android, typecheck, export:web, deploy:cloudflare
├── tsconfig.json                   # extends expo/tsconfig.base, adds @cloudflare/workers-types
├── wrangler.jsonc                  # Cloudflare Worker + static assets config
├── google-services.json            # Android Firebase config (note: package mismatch, see notes)
├── .env.example                    # EXPO_PUBLIC_* template
│
├── assets/
│   ├── icon.png, splash-icon.png, favicon.png, android-icon-*.png
│   └── photos/                     # 11 CC-licensed photos, see assets.md
│
├── scripts/
│   ├── deploy-cloudflare-global.sh # legacy global-key deploy (resolves zone + DNS, then wrangler)
│   └── deploy-worker.sh            # wrapper that loads .env.cloudflare.local and execs the global script
│
├── src/
│   └── worker.ts                   # Cloudflare Worker: POST /api/itinerary-email (Resend)
│
├── android/                        # native Android project (prebuild)
├── docs/                           # this folder
└── dist/                           # Expo web export output (gitignored)
```

## Recent redesign (2026-06)

The app received a full UI redesign that brings it in line with the latest mockup. Major changes:

- New red/white palette (`#da251d` primary) replacing the previous teal/cream.
- Bottom navigation trimmed to 4 tabs: **Khám phá / Yêu thích / Lịch sử / Tài khoản**.
- 17 distinct screens (vs. 7 tab views before), each reachable through the in-app routing table.
- New screens: Search, Filter, Map view (placeholder), Offline mode, Settings, Language support, Itinerary PDF preview, Emergency numbers.
- New persisted state: recent searches (8 items) and settings (theme, notifications, units, font scale, version).
- Full Vietnamese translation now covers every UI string.

See [App Overview](./app-overview.md) for the per-screen walkthrough.

## Conventions Used in These Docs

- File references are workspace-relative; line numbers use the format `path/to/file.ts:42` when pointing at exact lines in the current source.
- Code blocks are copy-pasteable; if a value is shown as a placeholder (e.g. `G-XXXXXXXXXX`), substitute your own before running.
- Where the docs intentionally diverge from shipped behavior (for example because a feature is reserved for a later milestone), it is called out as a "reserved" or "planned" note in the relevant page.
- `npm run typecheck` requires `--stack-size=20000` (already configured in `package.json`). Don't run `npx tsc` directly or the type-checker will crash on the very large `translations` object.
