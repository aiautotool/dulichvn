# Offline Mode

The Offline feature has two surfaces: a **full-page Offline screen** and a **persistent banner** that can be shown across any tab.

## Triggering

- Tapping the wifi icon in the top bar toggles `showOfflineBanner`.
- When the banner is visible, a small red bar appears below the header across every screen.
- The Offline screen (`activeTab === 'offline'`) is a separate full-page view reachable by tapping the banner or the wifi icon when the banner is already visible.

## Offline Screen Layout

- **Hero:**
  - A circular red-tinted icon with a `WifiOff` glyph.
  - "Bạn đang ở chế độ ngoại tuyến" (You are offline) title.
  - "Một số tính năng có thể không khả dụng cho đến khi bạn kết nối lại" subtitle.
- **"Có nội dung đã lưu" card** (cached content available):
  - Địa điểm đã xem (Places you've viewed)
  - Món ăn đã lưu (Saved food)
  - Lịch trình đã tạo (Created itineraries)
- **"Khả dụng khi có mạng" card** (requires connection):
  - Bản đồ (Maps)
  - Đặt taxi (Taxi booking)
  - Trò chuyện trực tiếp (Live chat)
- "Thử lại kết nối" (Retry connection) primary button. Tapping it hides the banner and returns to the home tab.

## Offline Banner Layout

- A horizontal pill below the top bar with:
  - A small red `WifiOff` icon.
  - "Bạn đang ở chế độ ngoại tuyến" text.
  - An X button to dismiss.
- Visible across every tab until the user dismisses it or taps "Retry connection".

## Source Map

| Symbol | Purpose |
| --- | --- |
| `OfflineScreen` component | Renders the full page. |
| `showOfflineBanner` state (in `App`) | Drives the banner visibility. |

## Tracked Events

| Event | Trigger | Key params |
| --- | --- | --- |
| `screen_view` | Returning to the home tab from the Offline screen | `screen_name: 'home'` |

The `offline_mode_viewed` event is defined in the event union but not yet fired. In a future iteration, it could be fired when the user opens the offline screen.

## Limitations

This is a UI-only feature in the MVP. It does not detect actual network connectivity; the user has to manually tap the wifi icon to enter offline mode. Real network detection via `NetInfo` is on the [Roadmap](../roadmap.md).

## Edge Cases

- The Offline screen is reachable even without a real network event. It is meant to communicate the *intent* to be offline, not the *state* of the device's network.
- The banner is dismissed by tapping the X, but the offline screen remains reachable through the wifi icon.
