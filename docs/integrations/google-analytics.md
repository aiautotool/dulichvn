# Google Analytics

Vinago+ ships a unified analytics layer that works on web, iOS, and Android. Every event is queued with the same context, then either forwarded to GA4 (web, when configured) or held in AsyncStorage (native or unconfigured web).

## Property Metadata

Stored in `app.json` under `extra.googleAnalytics`:

| Field | Value |
| --- | --- |
| Property name | `vinago-e7476` |
| Property ID | `542368554` |
| Stream ID | `15118007638` |

These are surfaced in the `app-analytics.md` doc and embedded in the bundle. The web `gtag` Measurement ID (`G-XXXXXXXXXX`) is **not** the Stream ID; it must be supplied at build/run time via `EXPO_PUBLIC_GA_MEASUREMENT_ID`.

## Module Constants

```ts
const analyticsConfig = {
  propertyName: 'vinago-e7476',
  propertyId: '542368554',
  streamId: '15118007638',
  measurementId: process.env.EXPO_PUBLIC_GA_MEASUREMENT_ID, // undefined unless set
};
const analyticsSessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
```

The session ID is generated once at module load and stays stable for the lifetime of the JS runtime.

## Common Event Parameters

`sanitizeAnalyticsParams` strips `undefined` values and forwards every event with the following context:

| Parameter | Source |
| --- | --- |
| `app_name` | hard-coded `'Vinago+'` |
| `platform` | `Platform.OS` (`ios`, `android`, `web`) |
| `session_id` | `analyticsSessionId` |
| `locale` | `getLocale(profile.language)` |
| `language` | `profile.language` |
| `current_city` | `profile.currentCity` |
| `purpose` | `profile.purpose` |
| `trip_days` | `profile.tripDays` |
| `ga_property_id` | `analyticsConfig.propertyId` |
| `ga_stream_id` | `analyticsConfig.streamId` |

Event-specific params are merged in by the caller. Examples:

- `place_opened` adds `place_id`, `place_name`, `place_city`, `place_category`, `source_screen`.
- `search_submitted` adds `query_length`, `source_screen`, `query_language`.
- `itinerary_generated` adds `trip_days`, `trip_style`, `current_city`.
- `itinerary_email_sent` adds `itinerary_days`, `delivery_mode`, `email_domain`, and on the composer path also `composer_status`.

See the per-feature pages (Home, Explore, Food, AI, etc.) for the full per-event parameter list.

## Transport

```ts
function sendGoogleAnalyticsEvent(payload) {
  if (Platform.OS !== 'web' || !analyticsConfig.measurementId?.startsWith('G-')) return false;
  const windowRef = globalThis.window;
  if (!windowRef?.gtag) return false;
  windowRef.gtag('event', payload.eventName, { ...payload.params, event_timestamp: payload.timestamp });
  return true;
}

async function enqueueAnalyticsEvent(payload) {
  const storedQueue = await AsyncStorage.getItem(ANALYTICS_QUEUE_KEY); // 'vinago-plus-analytics-queue'
  const queue = storedQueue ? JSON.parse(storedQueue) : [];
  queue.push(payload);
  await AsyncStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(queue.slice(-100)));
}
```

- `trackEvent(name, params, profile)` first tries `sendGoogleAnalyticsEvent`. On web with a valid `G-` ID and an existing `gtag`, the event is sent immediately.
- Otherwise the event is appended to the AsyncStorage queue, capped at the last 100 entries. The queue is intentionally small to stay friendly to low-end devices.
- Analytics errors are swallowed. The travel workflow must never break because of analytics.

## Initialization

`initializeGoogleAnalytics()` runs in a `useEffect(() => { initializeGoogleAnalytics(); }, [])` on first mount:

- If `Platform.OS !== 'web'` or `measurementId` is missing, returns immediately.
- If `measurementId` does not start with `G-`, logs a warning that includes the property and stream IDs (so the operator knows where to look) and returns.
- If a `gtag` script tag with id `vinago-ga4` is already present, returns.
- Otherwise injects `https://www.googletemagager.com/gtag/js?id=${measurementId}` (asynchronously) and configures the `dataLayer` / `gtag` shim with `send_page_view: false` and the property/stream IDs.
- The first `app_opened` event is fired from a separate effect and reports `ga_measurement_configured: Boolean(measurementId?.startsWith('G-'))`.

## Event Catalog

The full `AnalyticsEventName` union has 32 entries:

| Event | Source |
| --- | --- |
| `app_opened` | first effect after boot |
| `onboarding_started` | first time the onboarding screen renders (gated by `didTrackOnboardingRef`) |
| `onboarding_completed` | `saveProfile()` |
| `profile_reset` | `resetOnboarding()` |
| `language_selected` | language chip in onboarding or profile settings |
| `purpose_selected` | purpose chip |
| `city_selected` | city chip |
| `trip_days_selected` | day chip in onboarding, plus the AI itinerary stepper |
| `screen_view` | active tab changes (gated by `previousScreenRef`) |
| `tab_opened` | every tab/quick-tab tap |
| `search_submitted` | `submitSearch()` from the top bar |
| `filter_changed` | city/category/phrase-situation filters |
| `place_opened` | place row tap (from any source) |
| `food_opened` | food row tap |
| `favorite_added` / `favorite_removed` | `toggleFavorite` |
| `ai_question_submitted` | every `askAi` call |
| `itinerary_generated` | "Generate itinerary" button |
| `itinerary_saved` | "Save" CTA on the preview |
| `itinerary_exported` | "Export PDF" CTA or "Tải PDF" |
| `google_sign_in_started` / `google_sign_in_completed` / `google_sign_in_failed` / `google_signed_out` | auth flow |
| `activity_history_cleared` | "Xóa tất cả" button on the History tab |
| `recent_search_cleared` | "Xóa tất cả" link on the Search screen |
| `settings_changed` | any toggle / dot tap on the Settings screen |
| `offline_mode_viewed` | (defined but not yet fired) |
| `itinerary_email_requested` / `itinerary_email_sent` / `itinerary_email_failed` | email flow |

## Recommended GA4 Explorations

The legacy doc `docs/app-analytics.md` proposes these dashboards:

| Dashboard | Key dimensions |
| --- | --- |
| Users by language | `language`, `platform` |
| Retention by language | D1/D7/D30 |
| Search by language | `search_submitted` event with `query_language` |
| AI by language | `ai_question_submitted`, `itinerary_generated`, `itinerary_email_sent` |
| Content by language | `place_opened`, `food_opened`, `favorite_added` |
| Revenue by language | (future) premium conversion, affiliate CTR |

## Native App Next Step

For full GA4 reporting on iOS and Android, create Firebase app streams and add the platform config files:

| Platform | Required config |
| --- | --- |
| iOS | `GoogleService-Info.plist` |
| Android | `google-services.json` (must match `com.vinago.plus`) |

Then either wire the native analytics SDK or have the app drain the AsyncStorage queue to a server-side endpoint, which can forward events with privacy controls.

## Privacy & Debugging

- No PII is included in event params. The user's email address is never sent through analytics.
- For development, you can read the AsyncStorage queue with `AsyncStorage.getItem('vinago-plus-analytics-queue')` in the React Native debugger.
- For web, the gtag script is identified by the DOM element id `vinago-ga4`. You can inspect it in DevTools.
