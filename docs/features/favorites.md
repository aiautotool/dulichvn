# Favorites

The Favorites tab hosts the user's saved places, dishes, phrases, and culture tips. It is reachable from the bottom nav.

## Screen Layout

- Horizontal tab row: **All / Địa điểm / Món ăn / Câu giao tiếp** (plus an implicit `culture` filter via the `All` tab). The chips filter the list by `record.type`.
- Vertical list of `favoriteRecords` cards. Each card has:
  - Title + subtitle (e.g. "Hà Nội" for a place, "Beef noodle soup" for a food).
  - Star rating row.
  - Trash icon (right) — currently visual; tapping it does not actually remove the favorite. Removal happens through the heart button on the source screen.

If the list is empty, the screen shows an empty state with a heart icon, "Chưa có mục yêu thích" title, and a body explaining how to add favorites.

## Source Map

| Symbol | Purpose |
| --- | --- |
| `FavoritesScreen` component | Renders the tab filter and the list. |
| `favoriteRecords` derived in `App` | Flattened list with `key`, `type`, `id`, `title`, `subtitle`. |

## Storage

- Key: `AsyncStorage["vinago-plus-favorites"]`.
- Value: `SavedItem[]`.
- Persisted on every change via a `useEffect` that watches `favorites`.

## Mutation

- `toggleFavorite(type, id)` (in `App`):
  - Removes the pair if it is already saved.
  - Adds the pair otherwise.
  - Records `favorite` activity (`Saved favorite` or `Removed favorite`).
  - Fires `favorite_added` or `favorite_removed` with `item_type` and `item_id`.

## Projection

| Type | Title source | Subtitle source |
| --- | --- | --- |
| `place` | `place.name` | `place.city` |
| `food` | `food.name` | `food.englishName` |
| `phrase` | `phrase.english` | `phrase.vietnamese` |
| `culture` | `topic.title` | `topic.category` |

Tapping a favorite on this tab calls `onOpenTab` (via `openPlace` / `openFood` in `App`), which switches the active tab to the right screen and records `navigation` activity.

## Tracked Events

| Event | Trigger | Key params |
| --- | --- | --- |
| `favorite_added` / `favorite_removed` | `toggleFavorite` (called from detail screens, not from the Favorites tab itself) | `item_type`, `item_id` |
| `place_opened` | Tapping a place favorite | `place_id`, `place_name`, `place_city`, `place_category`, `source_screen: 'favorites'` |
| `food_opened` | Tapping a food favorite | `food_id`, `food_name`, `food_region`, `source_screen: 'favorites'` |

The trash icon does not currently remove the favorite. To remove, navigate to the source screen and tap the heart.

## Privacy

The favorites list is 100% local to the device. Nothing is sent to the backend.

## Edge Cases

- A favorite that references a removed catalog entry is hidden from the list (filtered out by `favoriteRecords`), but the underlying `SavedItem` is still in storage. It will reappear if the catalog entry is re-added with the same `id`.
