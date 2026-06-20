# Search

The Search screen is reachable from the top-bar search icon on the main shell. It is a dedicated search experience that combines recent queries, suggestions, and grouped results.

## Screen Layout

- **Search input row:** a tappable TextInput with a search icon, an X (clear) button when there is text, and a search-icon trailing button.
- **Recent searches section** (only when the input is empty and `recentSearches.length > 0`):
  - "Tìm kiếm gần đây" title.
  - "Xóa tất cả" link (right-aligned).
  - Chip row of recent queries with a clock icon.
- **Suggestions section** (when the input is empty):
  - "Gợi ý" title.
  - 2-column grid of curated `Place` cards (the same `popularPlaces` shown on the Home tab).
- **Results section** (when the input is non-empty):
  - "Địa điểm phổ biến" group, listing matching `Place`s.
  - "Món ăn phổ biến" group, listing matching `Food`s.
  - Empty state when no matches are found.

Tapping a result row calls `openPlace` or `openFood` (in `App`), which switches the active tab to the appropriate detail screen and fires `place_opened` / `food_opened`.

## Source Map

| Symbol | Purpose |
| --- | --- |
| `SearchScreen` component | Renders the screen. |
| `recentSearches` state | From `AsyncStorage["vinago-plus-recent-searches"]`, capped at 8. |
| `submitSearch` (in `App`) | Records the search, persists it to recent searches, and forwards to `askAi`. |
| `clearRecentSearches` (in `App`) | Removes the AsyncStorage key. |

## Tracked Events

| Event | Trigger | Key params |
| --- | --- | --- |
| `search_submitted` | Pressing the search button or Enter | `query_length`, `source_screen`, `query_language` |
| `recent_search_cleared` | "Xóa tất cả" link | `source_screen` |
| `place_opened` | Tapping a place result | `place_id`, `place_name`, `place_city`, `place_category`, `source_screen: 'search'` |
| `food_opened` | Tapping a food result | `food_id`, `food_name`, `food_region`, `source_screen: 'search'` |

## Search Logic

`SearchScreen` filters the catalogs by the lower-cased query:

- **Places:** `${place.name} ${place.city} ${place.category} ${place.tags.join(' ')}` includes the needle.
- **Foods:** `${food.name} ${food.englishName} ${food.region}` includes the needle.

When the input is empty, the screen shows the suggestion grid (curated `popularPlaces`).

## Privacy

Recent searches are stored locally in AsyncStorage. They are not sent to the backend.

## Edge Cases

- The clear (X) button only appears when the input has at least one character.
- The "Recent searches" section is hidden when the input is non-empty, even if there are recent searches.
- The suggestions grid shows up to 4 curated places by default.
