# Map View

The Map screen is a placeholder that shows the current place's coordinates and an "Open in Maps" link. It is reachable from the Place Detail screen's map preview.

## Screen Layout

- **Header:** back button + "Chế độ bản đồ" title.
- **Body:** centered content with:
  - A circular pin icon (red, on a soft-red background).
  - Place name (18 px, bold).
  - Coordinates: `{lat.toFixed(3)}, {lng.toFixed(3)}` in muted text.
  - "Mở trong bản đồ" (Open in Maps) primary button.
- If no `place` is passed (e.g. when the screen is reached from elsewhere), the body falls back to the `map.subtitle` text.

## Behavior

`openInMaps(place)` (helper at the top of `App.tsx`) opens the device's native maps app:

- iOS: `maps:0,0?q={name}@{lat},{lng}`
- Android: `geo:{lat},{lng}?q={name}`
- Web / fallback: `https://www.google.com/maps/search/?api=1&query={lat},{lng}`

The fallback ensures that web users can still get directions even if the device's native maps app is not installed.

## Source Map

| Symbol | Purpose |
| --- | --- |
| `MapScreen` component | Renders the placeholder. |
| `openInMaps(place)` | Helper that dispatches `Linking.openURL` with the right scheme. |
| `selectedPlace` derived in `App` | The place to show. |

## Tracked Events

The Map screen does not currently fire any analytics events. In a future iteration, `map_opened` could be added.

## Limitations

This is a placeholder. A real map view (Google Maps SDK, Mapbox, or `react-native-maps`) is on the [Roadmap](../roadmap.md). The current screen is enough to demonstrate the "Open in Maps" flow without bundling a heavy SDK.

## Edge Cases

- Tapping the back arrow returns to the place detail if a `pendingPlaceId` is set; otherwise to the home tab.
- The coordinates always render with 3 decimal places.
