# App Overview

This page is a top-down tour of `App.tsx`. It maps every screen, panel, and state machine to the corresponding source region so you can navigate the 5,172-line single file quickly.

> All line numbers refer to the current `App.tsx` in this repo. Screens have been refactored to be functionally separate (each is its own function component) even though they live in one file.

## 1. Module Layout (in source order)

| Region | Lines (approx.) | Purpose |
| --- | --- | --- |
| Imports & type aliases | 1 – 260 | `AsyncStorage`, native Firebase account services, `expo-mail-composer`, lucide icons, RN core, all `type` declarations. |
| Storage keys & constants | 260 – 350 | `PROFILE_KEY`, `FAVORITES_KEY`, `QR_WEB_SESSION_KEY`, `ACTIVITY_HISTORY_KEY`, `ANALYTICS_QUEUE_KEY`, `RECENT_SEARCHES_KEY`, `SETTINGS_KEY`, Firebase server client ID, `analyticsConfig`. |
| Analytics event names | 350 – 410 | Union of every event the app fires (32 events). |
| `languages`, `purposes`, `cities`, `defaultProfile`, `defaultSettings` | 410 – 470 | Catalog data. |
| `translations` (en/vi) | 470 – 880 | In-file i18n dictionary. ~220 keys, fully covered for both EN and VI. |
| `places` catalog | 880 – 1170 | 16 curated Vietnamese destinations. |
| `foods` catalog | 1170 – 1240 | 9 dishes (phở, bánh mì, bún bò Huế, cơm tấm, bún chả, cao lầu, mì Quảng, gỏi cuốn, cà phê sữa đá). |
| `cultureTopics` catalog | 1240 – 1260 | 4 dos/don'ts topics. |
| `phrases`, `emergencyCards`, `tripStyles`, `bottomTabItems`, `quickQuestions`, `popularPlaceIds`, `popularFoodIds` | 1260 – 1370 | Survival phrases, 113/114/115 + Tourist Police/Hotline, styles, tabs, quick prompts. |
| Pure helpers | 1370 – 1640 | `getWelcomeMessage`, `getTodayCopy`, `getExperienceSubtitle`, `getEmailDomain`, `decodeJwtPayload`, `normalizeGoogleUser`, `buildAiAnswer`, `buildItineraryPreview`, `buildPlainTextEmail`, `formatHistoryTimestamp`, `isToday`, `createItineraryConfirmation`, `buildItineraryEmailBody`, `openInMaps`. |
| Analytics helpers | 1640 – 1720 | `trackEvent`, `sendGoogleAnalyticsEvent`, `enqueueAnalyticsEvent`, `sanitizeAnalyticsParams`, `initializeGoogleAnalytics`. |
| Design tokens | 1720 – 1750 | `colors`, `radii`, `spacing`. |
| Shared UI primitives | 1750 – 1980 | `Panel`, `SectionTitle`, `ChoiceChip`, `ChipGrid`, `PrimaryButton`, `IconButton`, `HeaderBar`, `EmptyState`, `LogoMark`, `BrandHeader`. |
| OnboardingScreen | 1980 – 2110 | Welcome hero + 3-step chooser (language → purpose → city + days). |
| HomeScreen | 2110 – 2280 | Greeting + search bar + 4 quick filter chips + recent searches + popular grid + nearby section. |
| ExploreScreen | 2280 – 2360 | City tabs + horizontal place list. |
| PlaceDetailScreen | 2360 – 2450 | Hero image, tags, info card, map preview, save CTA, ask AI. |
| FoodScreen | 2450 – 2530 | Tabs (Phở & Bún / Vùng miền / Đặc sản) + list. |
| FoodDetailScreen | 2530 – 2620 | Hero, region/spice/price/pronunciation, allergens, ordering. |
| CultureScreen | 2620 – 2680 | Card grid with "Nên" / "Không nên" badges. |
| PhrasesScreen | 2680 – 2760 | Situation filter + phrase rows with Expo Speech audio playback. |
| EmergencyScreen | 2760 – 2800 | 113/114/115 + Tourist Police + Tourist Hotline. |
| FavoritesScreen | 2800 – 2870 | Tabs + saved items. |
| HistoryScreen | 2870 – 2950 | Grouped (Today / Earlier) activity log + clear button. |
| AccountScreen | 2950 – 3060 | Account header, account info rows, language section, settings, sign out. |
| SearchScreen | 3060 – 3180 | Recent searches + suggestions + grouped results. |
| SettingsScreen | 3180 – 3260 | Notifications / theme / units / font scale / version. |
| LanguageScreen | 3260 – 3310 | Language list with flags. |
| FilterScreen | 3310 – 3390 | City + category + price + rating filters with Apply/Reset. |
| OfflineScreen | 3390 – 3460 | Full-page offline state with cached/online lists. |
| MapScreen | 3460 – 3510 | Leaflet/OpenStreetMap map, marker + "Open in Maps" link. |
| AiScreen | 3510 – 3630 | Itinerary builder + chat + input. |
| ItineraryPreviewScreen | 3630 – 3690 | Preview card with Save / Send email / Export PDF. |
| ItineraryPdfScreen | 3690 – 3740 | Plain-text PDF preview + Share/Export. |
| Main `App` component | 3740 – 4350 | All state, effects, handlers, routing table, header, bottom nav. |
| `BottomNav` | 4350 – 4400 | Bottom navigation bar. |
| `colors`, `styles` | 4400 – end | Design tokens and `StyleSheet` (321 keys). |

## 2. Routing & Layout

- `useState<TabId>` drives the active screen. `TabId` is a 20-value union: `home`, `explore`, `place_detail`, `food`, `food_detail`, `culture`, `phrases`, `emergency`, `ai`, `itinerary_preview`, `itinerary_pdf`, `favorites`, `history`, `account`, `search`, `settings`, `language`, `filter`, `map`, `offline`.
- `useWindowDimensions()` is used to detect wide screens (`width >= 900`):
  - **Wide:** a 220-px `sidebar` is rendered on the left; no bottom nav.
  - **Narrow:** a fixed `bottomNav` strip is rendered at the bottom.
- The top bar (`HeaderBar`) shows the current screen title, a back arrow for detail screens, and trailing actions: search, offline toggle, language/reset.
- A persistent `offlineBanner` shows below the header when the user has flagged the app as offline (clicking the wifi icon in the header).
- An `emailStatusBar` floats above the bottom nav when an itinerary email is in flight.

## 3. State Machines (in `App`)

```
App boot
  ├── loadLocalState()        → reads profile / favorites / auth / history / recent / settings
  ├── isBooting = false
  ├── initializeGoogleAnalytics() → web only
  ├── trackEvent('app_opened')  → first effect
  ├── (no profile)            → render OnboardingScreen
  └── (profile)               → render main shell

Onboarding (3 steps)
  selectLanguage / selectPurpose / selectDraftTripDays / selectOnboardingCity
  saveProfile() → AsyncStorage.setItem('vinago-plus-profile') + switch to Home tab
  resetOnboarding() (from top bar) → AsyncStorage.removeItem + re-show onboarding

Auth
  native mobile      → GoogleSignin.signIn → Firebase signInWithCredential
  auth observer      → onAuthStateChanged → setAuthSession
  web                → QR session polling → mobile approval with Firebase ID token
  signOutGoogle()    → clear state + Firebase/Google sign-out

Favorites
  toggleFavorite(type, id) → upsert SavedItem, persist, fire favorite_added/removed

Search
  submitSearch(query) → recordSearch() + recordActivity() + askAi()

AI
  askAi(question) → buildAiAnswer → push user + assistant messages + ai_question_submitted
  buildItinerary() → createItineraryConfirmation → setLastItinerary + itinerary_generated
  sendItineraryEmail() → either POST Worker or open expo-mail-composer

Settings
  updateSettings(patch) → merge + persist + settings_changed
  selectLanguage(language) → update profile + AsyncStorage + language_selected
```

## 4. Screen Inventory

| Tab / Screen | File location in App.tsx | Tracked events |
| --- | --- | --- |
| Onboarding | `OnboardingScreen` | `onboarding_started`, `language_selected`, `purpose_selected`, `city_selected`, `trip_days_selected`, `onboarding_completed`, `profile_reset` |
| Home | `HomeScreen` | `place_opened`, `food_opened`, `recent_search_cleared`, `filter_changed` |
| Explore | `ExploreScreen` | `filter_changed`, `place_opened`, `favorite_added/removed` |
| Place detail | `PlaceDetailScreen` | `place_opened`, `favorite_added/removed`, `ai_question_submitted` |
| Food list | `FoodScreen` | `food_opened`, `favorite_added/removed` |
| Food detail | `FoodDetailScreen` | `food_opened`, `favorite_added/removed`, `ai_question_submitted` |
| Culture | `CultureScreen` | `favorite_added/removed` |
| Phrases | `PhrasesScreen` | `filter_changed`, `favorite_added/removed` |
| Emergency | `EmergencyScreen` | (none) |
| AI | `AiScreen` | `ai_question_submitted`, `itinerary_generated`, `trip_days_selected` |
| Itinerary preview | `ItineraryPreviewScreen` | `itinerary_saved`, `itinerary_exported`, `itinerary_email_requested/sent/failed` |
| Itinerary PDF | `ItineraryPdfScreen` | `itinerary_exported` |
| Map | `MapScreen` | (none) |
| Favorites | `FavoritesScreen` | `favorite_added/removed` |
| History | `HistoryScreen` | `activity_history_cleared` |
| Account | `AccountScreen` | `google_sign_in_*`, `google_signed_out` |
| Settings | `SettingsScreen` | `settings_changed` |
| Language | `LanguageScreen` | `language_selected` |
| Search | `SearchScreen` | `search_submitted`, `recent_search_cleared`, `place_opened`, `food_opened` |
| Filter | `FilterScreen` | (none) |
| Offline | `OfflineScreen` | `screen_view` |

## 5. Persistence at a Glance

| What | Where | When |
| --- | --- | --- |
| Onboarding profile | `AsyncStorage["vinago-plus-profile"]` | Saved by `saveProfile`, removed by `resetOnboarding` |
| Favorites | `AsyncStorage["vinago-plus-favorites"]` | Updated on every `toggleFavorite` |
| QR web session | `AsyncStorage["vinago-plus-web-qr-session"]` | Saved after mobile QR approval, cleared on sign-out or verification failure |
| Legacy Google auth session | `AsyncStorage["vinago-plus-auth-session"]` | Removed during boot |
| Activity history (capped 80) | `AsyncStorage["vinago-plus-activity-history"]` | Pushed by every `recordActivity`, cleared via "Clear history" |
| Recent searches (capped 8) | `AsyncStorage["vinago-plus-recent-searches"]` | Pushed on every `submitSearch`, cleared via "Clear all" |
| Settings | `AsyncStorage["vinago-plus-settings"]` | Pushed on every `updateSettings` |
| Analytics queue (capped 100) | `AsyncStorage["vinago-plus-analytics-queue"]` | Pushed when gtag is unavailable |

## 6. Internationalization

- Two locales: `en` (English) and `vi` (Vietnamese). Both dictionaries are fully populated in the in-file `translations` object.
- The active locale is derived from `profile.language` via `localeByLanguage`.
- The dynamic welcome AI message is regenerated whenever the locale changes.
- The static `places`, `foods`, `phrases`, and `cultureTopics` catalogs remain English-only; UI chrome (labels, buttons, status messages) is fully translated. See [Localization](./localization.md) for the plan to localize content.

## 7. Premium / Reserved UI

The AI screen shows a "Premium-ready modules" panel listing four locked modules:

- AI Camera Guide
- Voice Translation
- Nearby with GPS
- Unlimited AI

These are visual placeholders; the strings come from the i18n table. Real implementations are tracked in [Roadmap](./roadmap.md).

## 8. Notable UX patterns

- **Deep linking via routing:** every detail screen has a dedicated `TabId` value, so the routing switch in `App` becomes a single function call. Back navigation is handled by a centralized back-button dispatcher in the `HeaderBar` `onBack` prop.
- **Pending place/food id:** when a place is opened from search, the `pendingPlaceId` state is set; if the user navigates from the place detail to the map screen and back, we restore the place detail instead of the home tab.
- **Recent searches as a first-class list:** the home screen surfaces the 5 most recent queries as chips above the popular grid; the dedicated search screen shows them in a full grid with a "Clear all" action.
- **Emergency numbers live alongside phrases:** the phrases screen is one of two shortcuts to emergency help — the dedicated emergency screen is reachable from the top bar.
