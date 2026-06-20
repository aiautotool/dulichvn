# Filter

The Filter screen is a modal sheet reachable from the Explore tab. It lets the user narrow the place list by city, category, price, and rating.

## Screen Layout

- **Header:**
  - "Bộ lọc" (Filter) back button.
  - "120 kết quả" (results count) on the right.
- **Body sections:**
  - **City** (`filter.city`): chip row with `All` and every onboarding city.
  - **Category** (`filter.category`): chip row with `All` and a hard-coded list (`Bay`, `Mountain`, `Heritage`, `Beach`, `Island`, `Cave`).
  - **Price range** (`filter.priceRange`): two text labels (`0 VND` / `1,000,000+ VND`) and a thin bar between them. The bar is visual only in this MVP.
  - **Rating** (`filter.rating`): three pills (`Tất cả` / `3 sao trở lên` / `4 sao trở lên`).
- **Footer:**
  - "Xóa tất cả" (Reset) button.
  - "Áp dụng" (Apply) primary button. Tapping it sets `selectedCity` to the chosen value and returns to the Explore tab.

## Source Map

| Symbol | Purpose |
| --- | --- |
| `FilterScreen` component | Renders the screen and manages local filter state. |
| `selectedCity` state (in `App`) | The Explore filter state. |

## Tracked Events

The current Filter screen does not fire any analytics events. The Explore filter changes that result from the filter still fire `filter_changed` when the user changes `selectedCity` in the chip row.

## Edge Cases

- The "Apply" button only commits the city filter back to the Explore tab. The other sections (category, price, rating) are visual in this MVP.
- Tapping "Reset" sets the local city state back to `All` and then tapping "Apply" would commit that to Explore.
- The "120 results" count is hard-coded and does not reflect the actual filtered set.
