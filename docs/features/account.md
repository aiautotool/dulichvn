# Account

The Account tab is the user's profile and settings hub. It is reachable from the bottom nav.

## Screen Layout

- **Header:**
  - If signed in: avatar (with the Google profile picture if available), name, email.
  - If signed in on mobile: a "Quét QR đăng nhập web" button opens the camera scanner and approves a web QR session with the current Firebase ID token.
  - If not signed in: avatar placeholder, "Chưa đăng nhận" title, "Đăng nhập bằng Google để đồng bộ yêu thích và email lịch trình" body, and a "Đăng nhập với Google" primary button.
  - If not signed in on web: a QR panel creates a Worker-backed login session so the mobile app can sign the browser in.
- **Account information section** (`account.accountInfo`):
  - Display name (with chevron).
  - Email.
  - Member since.
- **Language & region section** (`account.languageSection`):
  - App language (tapping opens the [Language Support](./language-support.md) screen).
- **Settings section** (4 rows):
  - Settings (tapping opens the [Settings](./settings.md) screen).
  - Privacy policy (placeholder).
  - Support center (placeholder).
  - Terms of use (placeholder).
- **Sign out button** (only when signed in): red text on a light-red background.

## Source Map

| Symbol | Purpose |
| --- | --- |
| `AccountScreen` component | Renders the tab. |
| `authSession` state | Drives the signed-in / signed-out branch. |
| `signInWithGoogle` / `signOutGoogle` (in `App`) | Auth handlers. |
| `createQrLoginSession` / `pollQrLoginSession` / `approveQrLoginSession` | QR web login API client. |
| `QrLoginScanner` | Native camera modal for scanning the web login QR. |
| `isGoogleAuthPending` / `canSignInWithGoogle` | Reflect the Firebase Google Sign-In state. |

## Tracked Events

| Event | Trigger | Key params |
| --- | --- | --- |
| `google_sign_in_started` | Tapping "Đăng nhập với Google" | `source_screen: 'account'`, `redirect_uri` |
| `google_sign_in_completed` | Firebase Auth user loaded | `source_screen`, `email_domain`, `verified_email` |
| `google_sign_in_failed` | Firebase/Google Sign-In error | `error_code` |
| `google_signed_out` | "Đăng xuất" | `source_screen`, `email_domain` |

## Edge Cases

- When the user is not signed in, the placeholder avatar shows a generic user icon.
- QR login needs the web app to reach the Worker and the phone app to approve with a fresh Firebase ID token. Native Firebase Auth is the source of truth; stale local profile storage is cleared.
- "Member since" is a hard-coded value (`2026-01`) in this MVP. In a future iteration, this could be read from the `AuthSessionState.signedInAt` timestamp.
- The "Privacy policy", "Support center", and "Terms of use" rows are placeholders — tapping them does not navigate anywhere in the current build.
