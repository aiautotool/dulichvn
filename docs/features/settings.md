# Settings

The Settings screen is reachable from the Account tab. It exposes five toggle rows for app-wide preferences.

## Screen Layout

Each row is a card with a title, body, and a control on the right:

1. **Notifications** (`settings.notifications.title`):
   - Title: "Thông báo"
   - Body: "Nhận mẹo du lịch và lời nhắc"
   - Control: a Switch bound to `settings.notificationsEnabled`.
2. **Theme** (`settings.theme.title`):
   - Title: "Giao diện"
   - Body: "Chế độ sáng" / "Chế độ tối" (updates when the switch toggles)
   - Control: a Switch bound to `settings.themeMode === 'dark'`.
3. **Measurement units** (`settings.units.title`):
   - Title: "Đơn vị đo"
   - Body: "Hệ mét (km, °C)" / "Hệ Anh (mi, °F)"
   - Control: a Switch bound to `settings.measurementUnit === 'imperial'`.
4. **Font size** (`settings.font.title`):
   - Title: "Cỡ chữ"
   - Body: "Điều chỉnh kích thước chữ"
   - Control: a row of 5 dots. The active dot is enlarged and red. Tapping a dot sets `settings.fontScale` to one of `0.85 / 0.95 / 1 / 1.1 / 1.2`.
5. **App version** (`settings.version.title`):
   - Title: "Phiên bản"
   - Body: "1.0.0"
   - Control: none.

## Source Map

| Symbol | Purpose |
| --- | --- |
| `SettingsScreen` component | Renders the rows. |
| `settings` state (in `App`) | The `SettingsState` object. |
| `updateSettings(patch)` (in `App`) | Merges a partial update, persists, and fires analytics. |
| `defaultSettings` constant | Initial values. |

## Tracked Events

| Event | Trigger | Key params |
| --- | --- | --- |
| `settings_changed` | Any toggle / dot tap | `keys: <comma-joined patched keys>` |

The event payload is a single `keys` string, not a structured object. If you need granular analytics for each setting, change the call site in `updateSettings`.

## Persistence

- Key: `AsyncStorage["vinago-plus-settings"]`.
- Value: full `SettingsState` object.
- Persisted on every change via a `useEffect` that watches `settings`.

## Limitations

- `themeMode`, `fontScale`, and `measurementUnit` are persisted but not yet consumed by the rest of the app. The MVP always renders the light theme at 1.0× scale with metric units. Real consumption is on the [Roadmap](../roadmap.md).

## Edge Cases

- The version number is hard-coded to `1.0.0` in the `defaultSettings` constant. Update both `SETTINGS_VERSION` and `defaultSettings.appVersion` together.
- The font scale row uses `Math.abs(scale - active) < 0.05` to determine the active dot, which avoids floating-point comparison issues.
