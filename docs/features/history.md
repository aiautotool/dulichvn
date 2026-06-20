# History

The History tab hosts the local activity log. It is reachable from the bottom nav.

## Screen Layout

- Header subtitle: "Các thao tác gần đây trên thiết bị này" (Recent actions on this device).
- Two grouped sections:
  - **Hôm nay** (Today) — entries whose timestamp is the current calendar day.
  - **Trước đó** (Earlier) — entries from previous days.
- Each entry has:
  - A history icon (left).
  - Title + optional detail line.
  - Localized timestamp (e.g. "Jun 20, 09:15").
- A "Xóa tất cả" (Clear all) button at the bottom.

If the log is empty, the screen shows an empty state with a history icon, "Chưa có hoạt động" title, and a body explaining what will appear here.

## Source Map

| Symbol | Purpose |
| --- | --- |
| `HistoryScreen` component | Groups entries by `isToday(timestamp)`. |
| `activityHistory` state | From `AsyncStorage["vinago-plus-activity-history"]`, capped at 80. |
| `clearActivityHistory` (in `App`) | Removes the storage key. |

## Storage

- Key: `AsyncStorage["vinago-plus-activity-history"]`.
- Value: `ActivityHistoryEntry[]`.
- Persisted on every change via a `useEffect` that watches `activityHistory` (and skips during boot).

## Mutation

- `recordActivity(type, title, detail?)` prepends a new entry to the array and trims it to `ACTIVITY_HISTORY_LIMIT` (80).
- The id is `${Date.now()}-${random}` so list rendering is stable.

## Categories

| Type | Examples |
| --- | --- |
| `app` | Boot |
| `auth` | "Started Google sign-in", "Signed in with Google", "Signed out of Google", "Google sign-in failed" |
| `profile` | "Completed travel profile", "Opened profile settings" |
| `navigation` | "Opened Explore" (with `From {previousTab}` detail) |
| `search` | "Searched app content" (with the query as detail) |
| `filter` | "Changed city filter", "Changed category filter", "Changed phrase filter" |
| `content` | "Opened place", "Opened food guide" |
| `favorite` | "Saved favorite" / "Removed favorite" |
| `ai` | "Asked AI" (with the question as detail) |
| `itinerary` | "Changed itinerary days", "Generated itinerary", "Saved itinerary" |
| `email` | "Requested itinerary email", "Sent itinerary confirmation", "Itinerary email failed" |
| `settings` | "Changed settings" (with the patched keys as detail) |

## Clear

The "Xóa tất cả" button calls `clearActivityHistory()`, which:

1. Replaces `activityHistory` with `[]`.
2. Removes the AsyncStorage entry.
3. Fires `activity_history_cleared`.

Favorites are **not** affected.

## Tracked Events

| Event | Trigger | Key params |
| --- | --- | --- |
| `activity_history_cleared` | "Xóa tất cả" button | `source_screen` |

## Privacy

The history log is 100% local to the device. Nothing is sent to the backend.

## Edge Cases

- Entries are not localized. Titles are written in English so they are consistent in the analytics and history logs.
- `isToday` compares year, month, and date. Entries created in the user's current calendar day are grouped under "Hôm nay".
