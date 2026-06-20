# Food

The Food feature has two screens: **Food** (a tabbed list) and **Food Detail** (a hero + ingredient + ordering guide). Both are reachable from Home, the bottom nav, Favorites, and Search.

## Food List

### Screen Layout

- Title row: "Món ăn" + search icon.
- Horizontal tab row with 4 chips:
  - **Tất cả** (all)
  - **Phở & Bún**
  - **Vùng miền** (matches Bún / Cơm / Mì in the name)
  - **Đặc sản** (matches Hội An / Đà Nẵng / Huế regions)
- Vertical list of `Food` rows. Each row has an image, name, English name, region, and a heart icon (filled when the food is a favorite).

### Source Map

| Symbol | Purpose |
| --- | --- |
| `FoodScreen` component | Renders the list with tab filtering. |
| `popularFoods` constant | The 5 foods that are always passed in (phở, bánh mì, bún chả, cơm tấm, bún bò Huế). |

### Tracked Events

| Event | Trigger | Key params |
| --- | --- | --- |
| `food_opened` | Tapping a row | `food_id`, `food_name`, `food_region`, `source_screen: 'food'` |

## Food Detail

### Screen Layout

- **Hero image:** 280 px tall with back button.
- **Title block:** name (24 px), English subtitle, star rating.
- **Info card:** Region / Spice / Price / Pronunciation.
- **Ingredients section:** comma-joined list.
- **Allergens section** (only when `allergens.length > 0`): warning box with the list.
- **Ordering section:** phrase card showing the English line, Vietnamese sentence (`howToOrder`), and pronunciation.
- **Save to favorites CTA.**
- **"Có cay không?" CTA:** pushes a question to the AI and switches to the AI tab.

### Source Map

| Symbol | Purpose |
| --- | --- |
| `FoodDetailScreen` component | Renders the detail. |
| `selectedFood` derived in `App` | The `Food` object for `selectedFoodId`. |
| `toggleFavorite('food', id)` | Save button. |

### Tracked Events

| Event | Trigger | Key params |
| --- | --- | --- |
| `food_opened` | Screen mount (via `openFood` in `App`) | `food_id`, `food_name`, `food_region`, `source_screen: 'food'` |
| `favorite_added` / `favorite_removed` | Save button | `item_type: 'food'`, `item_id` |
| `ai_question_submitted` | "Is it spicy?" CTA | `question_length`, `response_locale`, `source_screen: 'food_detail'` |

## Spice & Allergen Semantics

- `spicyLevel` is `0 | 1 | 2 | 3`. The badge shows `{spicyLevel}/3` and `buildAiAnswer` translates that into "not spicy", "usually mild", or "often spicy".
- `allergens` is a free-form list. The warning box only renders if the list is non-empty, and the comma-joined list is displayed after the localized "Có chứa" label.

## Search Integration

The top-bar `SearchBox` filters `foods` by name, English name, region, and ingredients. The `search_submitted` event reports `result_food_count`.

## Edge Cases

- The catalog is intentionally small (9 dishes) for the MVP. Adding more is a content-only change in `foods`.
- The detail panel is always rendered against `selectedFood = foods.find(...)` derived from `selectedFoodId`, so out-of-filter selections still work.
