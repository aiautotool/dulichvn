# Map View

The Map screen renders OpenStreetMap tiles through a small Leaflet view. On web it uses an iframe `srcDoc`; on iOS/Android it uses `react-native-webview`. It is reachable from the Place Detail screen's map preview and from the home tools grid.

## Screen Layout

- **Header:** back button + "Chế độ bản đồ" title.
- **Map canvas:** full-height Leaflet map centered on the selected place, with a marker for that place. When no place is selected, it centers on Vietnam.
- **Bottom sheet:** place name, coordinates, and "Mở trong bản đồ" (Open in Maps) primary button.
- **Attribution:** the embedded map shows `© OpenStreetMap contributors`.
- **Fallback states:** if Leaflet or tiles cannot load, the map area shows an explanatory fallback panel plus the same external maps CTA.

## Behavior

- Android/iOS render the same Leaflet/OpenStreetMap HTML through `react-native-webview`.
- Web renders the same Leaflet/OpenStreetMap HTML through an iframe.
- `openInMaps(place)` (helper at the top of `App.tsx`) opens the device's native maps app:

- iOS: `maps:0,0?q={name}@{lat},{lng}`
- Android: `geo:{lat},{lng}?q={name}`
- Web / fallback: `https://www.openstreetmap.org/?mlat={lat}&mlon={lng}#map=16/{lat}/{lng}`

The fallback ensures that web users can still get directions even if the device's native maps app is not installed.

## OpenStreetMap Usage

No Google API key or billing account is required. The current MVP uses public OpenStreetMap tiles from `https://tile.openstreetmap.org`.

For production or high-traffic usage, switch to a dedicated tile provider or hosted OSM tile service that matches the app's traffic and uptime needs. Public OSM tiles are useful for development and light usage but are not a commercial SLA-backed tile CDN.

## Source Map

| Symbol | Purpose |
| --- | --- |
| `MapScreen` component | Renders the Leaflet/OpenStreetMap map, marker, bottom sheet, and fallback. |
| `buildOpenStreetMapHtml` | Builds the iframe/WebView HTML that mounts Leaflet and OSM tiles. |
| `openInMaps(place)` | Helper that dispatches `Linking.openURL` with the right scheme. |
| `selectedPlace` derived in `App` | The place to show. |

## Tracked Events

The Map screen does not currently fire any analytics events. In a future iteration, `map_opened` could be added.

## Limitations

- The embedded map requires network access to load Leaflet assets and map tiles.
- Public OpenStreetMap tile usage should remain light; use a dedicated provider for production traffic.

## Edge Cases

- Tapping the back arrow returns to the place detail if a `pendingPlaceId` is set; otherwise to the home tab.
- The coordinates always render with 3 decimal places.
