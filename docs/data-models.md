# Data Models

This page documents every TypeScript domain type used by `App.tsx` and the in-file catalogs that drive the UI. It is meant to be the schema reference for content and engineering.

> All excerpts are abbreviated for readability; the canonical source is `App.tsx` itself.

## 1. Identity & Locale

```ts
type Locale = 'en' | 'vi';
type Language = 'English' | 'Vietnamese';
```

- `Language` is the user-facing label (used in onboarding chips, profile line, analytics).
- `Locale` is the BCP-47-ish code used for translation lookup and the `locale` analytics field.
- Mapping: `localeByLanguage: Record<Language, Locale>`.

## 2. Travel Profile

```ts
type Purpose =
  | 'Travel'
  | 'Sightseeing'
  | 'Food & Culinary'
  | 'Culture & History'
  | 'Văn hóa'
  | 'Khác';

type City =
  | 'TP. Hồ Chí Minh'
  | 'Hà Nội'
  | 'Đà Nẵng'
  | 'Hội An'
  | 'Huế'
  | 'Hạ Long'
  | 'Nha Trang'
  | 'Đà Lạt'
  | 'Other';

type UserProfile = {
  language: Language;
  purpose: Purpose;
  currentCity: City;
  tripDays: number;
};

const defaultProfile: UserProfile = {
  language: 'English',
  purpose: 'Travel',
  currentCity: 'TP. Hồ Chí Minh',
  tripDays: 3,
};
```

`onboardingCities` is a smaller subset exposed during onboarding to keep the first-run experience short:

```ts
const onboardingCities: City[] = [
  'TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Hội An',
  'Huế', 'Nha Trang', 'Phú Quốc', 'Đà Lạt', 'Other',
];
```

## 3. Settings

```ts
type SettingsState = {
  themeMode: 'light' | 'dark';
  notificationsEnabled: boolean;
  measurementUnit: 'metric' | 'imperial';
  fontScale: number;          // 0.85, 0.95, 1, 1.1, or 1.2
  appVersion: string;         // currently '1.0.0'
};

const defaultSettings: SettingsState = {
  themeMode: 'light',
  notificationsEnabled: true,
  measurementUnit: 'metric',
  fontScale: 1,
  appVersion: '1.0.0',
};
```

`fontScale` is consumed only by the Settings screen UI; the rest of the app currently uses the default scale of 1. The theme is also reserved — every screen is light-only today.

## 4. Recent Searches

```ts
type RecentSearch = {
  id: string;
  query: string;
  timestamp: string;          // ISO
};
```

Capped at 8 entries; deduped case-insensitively.

## 5. Content Models

### 5.1 `Place`

```ts
type Place = {
  id: string;                 // stable kebab-case id
  name: string;               // display name, also used by AI intent matching
  city: City;                 // primary city for "nearby" filtering
  category: string;           // free-form (Bay, Heritage, Mountain, Beach, etc.)
  description: string;        // one-paragraph overview
  history: string;            // cultural/historical context shown on detail
  bestTime: string;           // "Tháng 4 - Tháng 10"
  ticketPrice: string;        // "Miễn phí" | "Vé vào phố cổ" | ...
  openHours: string;          // human-readable hours
  lat: number;                // latitude (used by Map placeholder)
  lng: number;                // longitude
  tags: string[];             // e.g. ['Di sản UNESCO', 'Đã lưu']
  whyGo: string;              // short pitch
  travelTip: string;          // practical tip
  image: ImageSourcePropType; // require('./assets/photos/...')
};
```

The current catalog includes 16 entries: Hạ Long Bay, Hà Nội Phố Cổ, Hồ Gươm, Hội An, Đà Nẵng, Bà Nà Hills, Huế, Phú Quốc, Chợ Bến Thành, Sa Pa, Ninh Bình, Phong Nha, Mũi Né, Nha Trang, Đà Lạt, Cần Thơ. The Explore screen derives `placeCategories` from the catalog at runtime.

### 5.2 `Food`

```ts
type Food = {
  id: string;
  name: string;               // Vietnamese name, e.g. 'Phở bò'
  englishName: string;        // "Beef noodle soup"
  region: string;             // "Hà Nội" | "TP. Hồ Chí Minh" | "Hội An" | "Huế" | "Đà Nẵng"
  ingredients: string[];      // e.g. ['Bánh phở', 'Thịt bò', 'Hành', 'Nước dùng xương']
  spicyLevel: number;         // 0..3
  priceRange: string;         // "30,000 - 60,000 VND"
  allergens: string[];        // ['Bò', 'Nước mắm', 'Gluten', 'Sữa', 'Thịt heo', 'Tôm', 'Đậu phộng', 'Trứng']
  howToOrder: string;         // Vietnamese sentence ("Cho tôi một tô phở bò")
  pronunciation: string;      // Latinized pronunciation
  image: ImageSourcePropType;
};
```

### 5.3 `CultureTopic`

```ts
type CultureTopic = {
  id: string;
  title: string;              // "Nên: Cuối với và giữ thái đoan thành kính"
  category: string;           // "Tôn giáo" | "Đô thị" | "Mua sắm" | "Ẩm thực"
  explanation: string;
  dos: string[];
  donts: string[];
};
```

### 5.4 `Phrase`

```ts
type Phrase = {
  id: string;
  situation: string;          // "Greetings" | "Shopping" | "Food" | "Emergency" | "Directions"
  english: string;
  vietnamese: string;
  pronunciation: string;
  difficulty: 'easy' | 'medium';
};
```

## 6. Session & Activity

### 6.1 `ChatMessage`

```ts
type ChatMessage = {
  id: string;                 // 'welcome' for the seed message; `${Date.now()}-{user|assistant}` after that
  from: 'user' | 'assistant';
  text: string;
};
```

### 6.2 `SavedItem` & favorites

```ts
type SavedItemType = 'place' | 'food' | 'phrase' | 'culture';
type SavedItem = { id: string; type: SavedItemType };
```

`favoriteRecords` (derived in `App`) flattens these into a `{ key, type, id, title, subtitle }` shape for the Favorites screen by looking up the original entity from the corresponding catalog.

### 6.3 Google identity

```ts
type GoogleUser = {
  id: string;
  email: string;
  name: string;
  givenName?: string;
  picture?: string;
  verifiedEmail: boolean;
};

type AuthSessionState = {
  provider: 'google';
  user: GoogleUser;
  signedInAt: string;         // ISO
  lastSeenAt: string;         // ISO, refreshed on every restore
};
```

### 6.4 Activity history

```ts
type ActivityHistoryType =
  | 'app'
  | 'auth'
  | 'profile'
  | 'navigation'
  | 'search'
  | 'filter'
  | 'content'
  | 'favorite'
  | 'ai'
  | 'itinerary'
  | 'email'
  | 'settings';

type ActivityHistoryEntry = {
  id: string;
  type: ActivityHistoryType;
  title: string;
  detail?: string;
  timestamp: string;          // ISO
};
```

`recordActivity` always prepends a new entry and trims the array to `ACTIVITY_HISTORY_LIMIT` (80).

### 6.5 Itinerary confirmation

```ts
type ItineraryConfirmation = {
  id: string;
  title: string;              // "2 day Culture + Food itinerary"
  prompt: string;             // user-issued prompt
  body: string;               // full itinerary text used in the email body
  city: City;                 // profile.currentCity at generation time
  days: number;               // 1, 2, 3, or 5
  style: TripStyle;
  createdAt: string;          // ISO
};

const tripStyles = ['Culture + Food', 'Relaxed', 'Family', 'Business'] as const;
type TripStyle = (typeof tripStyles)[number];
```

## 7. Tab routing

```ts
type TabId =
  | 'home'
  | 'explore'
  | 'place_detail'
  | 'food'
  | 'food_detail'
  | 'culture'
  | 'phrases'
  | 'emergency'
  | 'ai'
  | 'itinerary_preview'
  | 'itinerary_pdf'
  | 'favorites'
  | 'history'
  | 'account'
  | 'search'
  | 'settings'
  | 'language'
  | 'filter'
  | 'map'
  | 'offline';
```

The bottom nav exposes only 4 of these (`home`, `favorites`, `history`, `account`). The remaining 16 are reachable through deep navigation: tapping a place row sets `activeTab = 'place_detail'`, the language button sets `activeTab = 'language'`, etc.

## 8. Analytics

```ts
type AnalyticsValue = string | number | boolean | null;
type AnalyticsParams = Record<string, AnalyticsValue | undefined>;
type AnalyticsEventName =
  | 'app_opened'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'profile_reset'
  | 'language_selected'
  | 'purpose_selected'
  | 'city_selected'
  | 'trip_days_selected'
  | 'screen_view'
  | 'tab_opened'
  | 'search_submitted'
  | 'filter_changed'
  | 'place_opened'
  | 'food_opened'
  | 'favorite_added'
  | 'favorite_removed'
  | 'ai_question_submitted'
  | 'itinerary_generated'
  | 'itinerary_saved'
  | 'itinerary_exported'
  | 'google_sign_in_started'
  | 'google_sign_in_completed'
  | 'google_sign_in_failed'
  | 'google_signed_out'
  | 'activity_history_cleared'
  | 'recent_search_cleared'
  | 'settings_changed'
  | 'offline_mode_viewed'
  | 'itinerary_email_requested'
  | 'itinerary_email_sent'
  | 'itinerary_email_failed';

type AnalyticsPayload = {
  eventName: AnalyticsEventName;
  params: Record<string, AnalyticsValue>;
  timestamp: string;
};
```

The session ID is computed once at module load: `` `${Date.now()}-${Math.random().toString(36).slice(2, 10)}` ``.

## 9. Worker API Contracts

### 9.1 Request (from `App.tsx`)

```ts
type ItineraryEmailRequest = {
  to: string;                 // must match the Google account email
  name?: string;
  itinerary: {
    title: string;
    body: string;
    city?: City;
    days?: number;
    style?: TripStyle;
    createdAt?: string;
  };
  profile?: {
    language?: Language;
    purpose?: Purpose;
    currentCity?: City;
    tripDays?: number;
  };
};
```

Sent as `POST {EXPO_PUBLIC_ITINERARY_EMAIL_ENDPOINT}` with header `Authorization: Bearer <googleIdToken>` and `Content-Type: application/json`.

### 9.2 Response (from `src/worker.ts`)

```ts
// success
{ ok: true, provider: 'resend', id: string | null }

// errors
{ error: 'Method not allowed' }                                  // 405
{ error: 'Email provider is not configured' }                    // 503
{ error: 'Missing Google ID token' }                              // 401
{ error: 'Google email is not verified' }                        // 403
{ error: 'Recipient must match the Google account email' }       // 403
{ error: 'Missing itinerary content' }                            // 400
{ error: 'Invalid JSON body' }                                    // 400
{ error: 'Email provider rejected the request', detail: string }  // 502
```

CORS: the Worker reflects the request `Origin` and allows `POST, OPTIONS` with `Authorization, Content-Type`. Preflight returns 200 with empty body.

## 10. Storage Keys (canonical strings)

| Key | Value | Type |
| --- | --- | --- |
| `PROFILE_KEY` | `vinago-plus-profile` | `UserProfile` |
| `FAVORITES_KEY` | `vinago-plus-favorites` | `SavedItem[]` |
| `AUTH_SESSION_KEY` | `vinago-plus-auth-session` | `AuthSessionState` |
| `ACTIVITY_HISTORY_KEY` | `vinago-plus-activity-history` | `ActivityHistoryEntry[]` |
| `RECENT_SEARCHES_KEY` | `vinago-plus-recent-searches` | `RecentSearch[]` (capped 8) |
| `SETTINGS_KEY` | `vinago-plus-settings` | `SettingsState` |
| `ANALYTICS_QUEUE_KEY` | `vinago-plus-analytics-queue` | `AnalyticsPayload[]` (capped 100) |
