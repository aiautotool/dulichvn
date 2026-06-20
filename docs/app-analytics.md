# Vinago+ App Analytics

Vinago+ analytics is designed for web, iOS, and Android, with language-level segmentation as a core product requirement.

## Google Analytics Property

| Field | Value |
| --- | --- |
| Property name | `vinago-e7476` |
| Property ID | `542368554` |
| Stream ID | `15118007638` |
| Web Measurement ID | Required separately, format `G-XXXXXXXXXX` |

The numeric Stream ID is not a GA4 web Measurement ID. Web events are sent through `gtag` only when `EXPO_PUBLIC_GA_MEASUREMENT_ID` is configured. Otherwise, events are queued locally in AsyncStorage so native app events and missing web config do not break user flows.

## Event Schema

Every event includes:

| Parameter | Description |
| --- | --- |
| `app_name` | `Vinago+` |
| `platform` | `ios`, `android`, or `web` |
| `session_id` | Anonymous per-launch session identifier |
| `locale` | Active app locale, for example `en`, `vi`, `ko` |
| `language` | Selected language label |
| `current_city` | Selected user city |
| `purpose` | Selected travel purpose |
| `trip_days` | Selected trip length |
| `ga_property_id` | GA4 property ID |
| `ga_stream_id` | GA4 stream ID |

## Product Events

| Event | Trigger |
| --- | --- |
| `app_opened` | App boot completes |
| `onboarding_started` | First onboarding view loads |
| `onboarding_completed` | User saves onboarding profile |
| `profile_reset` | User opens language/profile reset |
| `language_selected` | User selects language |
| `purpose_selected` | User selects travel purpose |
| `city_selected` | User selects city |
| `trip_days_selected` | User selects trip days |
| `screen_view` | Active app tab changes |
| `tab_opened` | User presses a tab/primary navigation item |
| `search_submitted` | Search box submitted |
| `filter_changed` | Explore, phrase, or itinerary filter changes |
| `place_opened` | User opens a place detail |
| `food_opened` | User opens a food detail |
| `favorite_added` | User saves content |
| `favorite_removed` | User removes saved content |
| `ai_question_submitted` | User asks AI |
| `itinerary_generated` | User generates an AI itinerary |

## Language Dashboards

Create GA4 explorations or backend dashboards for:

| Dashboard | Metrics |
| --- | --- |
| Users by language | DAU, new users, returning users, platform split |
| Retention by language | D1/D7/D30 retention, saved item rate |
| Search by language | Searches, zero-result queries, result counts |
| AI by language | AI questions, itinerary generations, response locale |
| Content by language | Place opens, food opens, favorite rate |
| Revenue by language | Premium conversion, affiliate CTR, sponsored listing CTR |

## Native App Next Step

For production iOS and Android GA4 reporting, create Firebase app streams and add the platform config files:

| Platform | Required config |
| --- | --- |
| iOS | `GoogleService-Info.plist` |
| Android | `google-services.json` |

Then connect a native analytics SDK or send queued events to the FastAPI backend, which can forward server-side analytics with privacy controls.
