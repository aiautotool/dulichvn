# Google Auth

Google sign-in is implemented with Expo SDK 56's `expo-auth-session` and `expo-web-browser`. It is the only authentication mechanism in the MVP and exists to tie itinerary emails to a verified Google email.

## Library Surface

```ts
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession(); // called at module top level
```

The hook:

```ts
const [googleRequest, googleResponse, promptGoogleSignIn] = Google.useIdTokenAuthRequest({
  webClientId:    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID    ?? FIREBASE_WEB_CLIENT_ID,
  androidClientId:process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?? FIREBASE_ANDROID_CLIENT_ID,
  iosClientId:    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
                 ?? process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
                 ?? FIREBASE_WEB_CLIENT_ID,
  redirectUri: AuthSession.makeRedirectUri({
    scheme: APP_SCHEME,        // 'vinagoplus'
    path: 'oauthredirect',
    native: `${APP_SCHEME}:/oauthredirect`,
  }),
  selectAccount: true,
  scopes: ['openid', 'profile', 'email'],
});
```

If no env var is set, the app falls back to the `959396812028-*` Firebase client IDs that are also embedded in `google-services.json`. The iOS fallback prefers the web client ID when the iOS env var is missing.

## Sign-In Flow

1. `signInWithGoogle()` is called from the top-bar account button, the Sidebar, or the `AccountPanel` on the AI tab.
2. It checks `googleRequest` and `isGoogleAuthPending` to prevent double prompts.
3. It fires `google_sign_in_started` with `source_screen` and `redirect_uri`.
4. `promptGoogleSignIn()` opens the Google consent screen.
5. A `useEffect` watches `googleResponse`:
   - On `error`, fires `google_sign_in_failed` and resets `isGoogleAuthPending`.
   - On `success`, reads `authentication.idToken` (or `params.id_token`) and `authentication.accessToken` (or `params.access_token`).
   - Fetches `https://www.googleapis.com/oauth2/v3/userinfo?access_token=...` to get the canonical `id`, `email`, `verified_email`, `name`, `given_name`, and `picture`.
   - Builds a `GoogleUser` and stores it in `authSession`.
   - Persists the session in `AsyncStorage["vinago-plus-auth-session"]`.
   - Stores the `id_token` in `googleIdToken` (used by the email endpoint).
   - Records `auth` activity ("Signed in with Google").
   - Fires `google_sign_in_completed`.

## Sign-Out

`signOutGoogle()`:

1. Clears `authSession`, `googleIdToken`, and `emailStatus`.
2. The auth-session effect removes `vinago-plus-auth-session` from AsyncStorage.
3. Records `auth` activity ("Signed out of Google").
4. Fires `google_signed_out` with the email domain (e.g. `gmail.com`).

## Configuration Checklist

### Web

Set the web OAuth client ID and add these redirect URIs to the client in Google Cloud Console:

| Environment | URI |
| --- | --- |
| Dev (Metro default) | `http://localhost:8081/oauthredirect` |
| Staging | `https://staging.vinago.aiautotool.com/oauthredirect` |
| Production | `https://vinago.aiautotool.com/oauthredirect` |

### Native

For Android, the OAuth client must match:

- Package name: `com.vinago.plus` (set in `app.json`).
- SHA-1: the certificate that signs the release build (typically the upload key).

For iOS, the OAuth client must match:

- Bundle ID: `com.vinago.plus`.
- URL scheme: `vinagoplus` (declared in `app.json` as `scheme`).

> The `google-services.json` in this repo was copied from a different Firebase project and declares Android package `com.vinago.dev`. It must be regenerated for `com.vinago.plus` before relying on native Google sign-in in production builds. The web OAuth client ID embedded in it is still useful as the default.

### Email Endpoint

The bearer ID token is sent to the Cloudflare Worker when the user emails an itinerary. See [Itinerary Email](./itinerary-email.md).

## Tracked Events

| Event | Trigger | Key params |
| --- | --- | --- |
| `google_sign_in_started` | `signInWithGoogle` is called | `source_screen`, `redirect_uri` |
| `google_sign_in_completed` | Profile is fetched and stored | `source_screen`, `email_domain`, `verified_email` |
| `google_sign_in_failed` | `promptGoogleSignIn` throws, or the response is an error, or no token is returned | `error_code` (`prompt_failed` / `missing_auth_token` / `profile_fetch_failed` / Google `errorCode`) |
| `google_signed_out` | `signOutGoogle` | `source_screen`, `email_domain` |

## Edge Cases

- The `id_token` is stored in component state only, **not** in AsyncStorage. After a full app restart, the user is still "signed in" (session is restored from AsyncStorage), but `googleIdToken` is null until the next sign-in. The email button will fall back to the OS composer in that case.
- `googleRequest` is `null` until the hook finishes initialization; the buttons render with `disabled` styles in that window.
- The redirect URI is computed at render time using `AuthSession.makeRedirectUri`, which on web returns the dev server URL + `/oauthredirect` and on native returns `vinagoplus:/oauthredirect`.

## Security Notes

- The Google `id_token` is not verified cryptographically by the app. The Worker only checks the `email_verified` flag in the payload. For production, consider verifying the JWT signature against Google's JWKS.
- The app does not store any Google refresh tokens; re-authentication is required after expiry.
- The Google profile picture URL is stored in the session and rendered as `<Image source={{ uri }} />`. It is not downloaded to disk.
