# Home

The Home tab is the landing screen after onboarding. It combines a search bar, four quick-filter chips, recent searches, and a popular-destinations grid into a single scrollable view.

## Screen Layout

- Greeting row: `home.greeting` ("Xin chào") + bell icon.
- Search bar with a tappable filter icon (right side). Tapping anywhere on the bar switches to the [Search](./search.md) screen; the filter icon opens the [Filter](./filter.md) screen.
- Horizontal chip row: **All / Food / Stay / Transport**. The chips are visual; selecting "Food" swaps the popular grid to popular foods, while "Stay" and "Transport" are placeholders for future content.
- Recent searches (if any): up to 5 chips with a clock icon. Only shown when `recentSearches.length > 0`.
- Popular destinations section: 2-column grid of `Place` cards with image + name + city/category.
- "Travel experiences you may enjoy" section: 3-item subset of `popularPlaces` filtered by `currentProfile.currentCity`. When the user picks `Other` in onboarding, the section falls back to the generic "Popular destinations" title.

## Source Map

| Symbol | Purpose |
| --- | --- |
| `HomeScreen` component | Renders the entire tab content. |
| `popularPlaceIds` / `popularFoods` constants | Curated subset of the catalogs (6 places, 5 foods) that appear on the home grid. |
| `recentSearches` state | From `AsyncStorage["vinago-plus-recent-searches"]`, capped at 8. |
| `getExperienceSubtitle` helper | Renders the localized "Recommendations for {city}" copy. |

## Tracked Events

| Event | Trigger | Key params |
| --- | --- | --- |
| `place_opened` | Tapping a place card | `place_id`, `place_name`, `place_city`, `place_category`, `source_screen: 'home'` |
| `food_opened` | Tapping a food card (Food chip active) | `food_id`, `food_name`, `food_region`, `source_screen: 'home'` |

The screen also indirectly triggers `search_submitted` (when the user navigates to Search) and `filter_changed` (when the user navigates to Filter).

## Behavioral Details

- The active "quick chip" state is local to the `HomeScreen` component — it does not propagate to Explore.
- The `popularPlaces` list is a curated subset of the catalog (`ha_long_bay`, `pho_co_hanoi`, `ba_na_hills`, `phu_quoc`, `ben_thanh`, `mui_ne`). Adding new curated places is a one-line change in the constants.
- The "nearby" section is filtered by `place.city === currentProfile.currentCity`. If the user is on `Other`, the section falls back to the generic title and shows the curated list (no city filter).

## Edge Cases

- If `popularFoods` is empty and the user has selected the "Food" chip, the screen shows an empty area. This is fine for the MVP because `popularFoods` is hard-coded.
- If the user has no recent searches, the section is hidden entirely (no empty state).
- The bell icon is a visual placeholder; it has no action wired.
