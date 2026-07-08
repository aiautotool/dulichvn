# Place Detail

The Place Detail screen is reached by tapping any place card (Home, Explore, Favorites, Search). It shows a hero image, tag chips, an info card with ticket / hours / best-time, a map preview, and Save / Ask AI CTAs.

## Screen Layout

- **Hero image:** 280 px tall with a dark overlay. A back arrow (top-left) and a Save button (top-right) sit on the overlay.
- **Title block:** place name (24 px), city · category, star rating + review count.
- **About section:** the place's `description` paragraph.
- **Why visit section:** the `whyGo` short pitch.
- **Tags row:** `place.tags.map(tag => <View>{tag}</View>)`. Each tag is a pill with the primary color.
- **Travel tips section:** an info card with three rows: `Best time`, `Ticket`, `Open hours`.
- **Map preview:** a pressable row showing `lat, lng` and a "Open in Maps" link. Tapping it dispatches `openMap()` (see [Map](./map.md)).
- **Save to favorites CTA:** primary button. Toggling it calls `toggleFavorite('place', id)`.
- **Ask AI button:** secondary action. Tapping it pushes a question to the AI chat and switches to the [AI](./ai-and-itinerary.md) screen.

## Source Map

| Symbol | Purpose |
| --- | --- |
| `PlaceDetailScreen` component | Renders the screen. |
| `selectedPlace` derived in `App` | The `Place` object for `selectedPlaceId`. |
| `isFavorite` / `onToggleFavorite` | From `App` (lifted state). |
| `openInMaps(place)` | Helper that opens the native maps app via `Linking.openURL` with an OpenStreetMap web fallback. |

## Tracked Events

| Event | Trigger | Key params |
| --- | --- | --- |
| `place_opened` | When the screen is opened | `place_id`, `place_name`, `place_city`, `place_category`, `source_screen` |
| `favorite_added` / `favorite_removed` | Save button | `item_type: 'place'`, `item_id` |
| `ai_question_submitted` | "Ask AI" button | `question_length`, `response_locale`, `source_screen: 'place_detail'` |

## Back Navigation

- The back arrow sets `activeTab` based on the source screen. Because the source is passed in, a place opened from Favorites returns to Favorites, while one opened from Explore returns to Explore.

## Edge Cases

- The Save button toggles state. The heart icon is filled when the place is in `favorites` and outline otherwise.
- The map preview always shows `lat` and `lng`; if the user is on web, the Open in Maps link opens the location on OpenStreetMap.
- The "Open in Maps" link is only shown when the place has `lat` and `lng` populated. All curated places have coordinates.
