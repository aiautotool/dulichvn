# Native Builds (iOS / Android)

The web app runs in any browser. Native builds (`.ipa` for iOS, `.aab` / `.apk` for Android) require platform-specific configuration. This page documents what is currently set up in the repo and what still needs to be done before shipping a native build.

## iOS

### Current state

- `app.json` declares `ios.bundleIdentifier: "com.vinago.plus"` and `ios.supportsTablet: true`.
- `app.json` declares `scheme: "vinagoplus"`, which is the deep-link scheme used by `AuthSession.makeRedirectUri` and the OAuth callback.
- There is no committed `ios/` directory. The Expo prebuild will generate one the first time you run `npx expo prebuild --platform ios`.

### Steps to produce a build

1. **Configure signing in Xcode** (or via `expo run:ios --configuration Release` after the prebuild).
2. **Create an iOS OAuth client** in Google Cloud Console with:
   - Bundle ID: `com.vinago.plus`
   - URL scheme: `vinagoplus` (added automatically by `expo-web-browser` plugin once prebuild has run)
3. **Set `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`** before running.
4. **Run** `npx expo run:ios` (debug) or `npx expo run:ios --configuration Release` (release).

### Known caveats

- No `GoogleService-Info.plist` is committed. The native sign-in path uses `expo-auth-session` and does not require Firebase Auth, so this is fine for the MVP. If you wire the native analytics SDK later, add the `GoogleService-Info.plist` and update the `expo` plugins in `app.json`.
- The first run after prebuild will fail with a "no team" error if you have not opened the project in Xcode and selected a development team.

## Android

### Current state

- `app.json` declares `android.package: "com.vinago.plus"` and `android.googleServicesFile: "./google-services.json"`.
- The `android/` directory is committed (prebuild has been run at least once).
- `android/app/src/main/AndroidManifest.xml` declares:
  - `INTERNET`, `VIBRATE`, `SYSTEM_ALERT_WINDOW` permissions
  - `queries` for `https` browserable intents (used by `expo-web-browser`)
  - `<activity android:name=".MainActivity">` with `android:screenOrientation="portrait"`
  - Deep-link intent filter for `vinagoplus` scheme
  - `predictiveBackGestureEnabled: false` (set in `app.json`)
- Adaptive icon: `assets/android-icon-{background,foreground,monochrome}.png` with background color `#EAF6F2`.

### Steps to produce a build

1. **Regenerate `google-services.json`** for the actual package `com.vinago.plus`. The committed file was copied from a different Firebase project and targets `com.vinago.dev` (see [`google-services.json` note below](#google-servicesjson-mismatch)).
2. **Add the SHA-1 of your release signing key** to the Android OAuth client in Google Cloud Console.
3. **Run** `npx expo run:android` (debug) or `npx expo run:android --variant release` (release).

### `google-services.json` mismatch

The committed `google-services.json`:

- Targets package `com.vinago.dev`.
- Embeds a Firebase web client ID and an Android client ID that are also used as fallbacks in `App.tsx`.

To use the app in production with the configured `com.vinago.plus` package, you must:

1. In the Firebase console, add a new Android app with package `com.vinago.plus`.
2. Download the new `google-services.json` and replace the committed file.
3. Verify that the embedded client IDs in `App.tsx` (`FIREBASE_ANDROID_CLIENT_ID`, `FIREBASE_WEB_CLIENT_ID`) are still consistent with the Firebase project, or override them via `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID`.

## Common prebuild commands

```bash
# Regenerate ios/ and android/ from app.json + plugins
npx expo prebuild --clean

# Run the iOS debug build
npx expo run:ios

# Run the Android debug build
npx expo run:android
```

> **`npx expo prebuild --clean` will delete the existing `android/` and `ios/` directories and re-create them.** Commit any custom native changes before running this, or move them into a config plugin.

## Native debugging

- iOS: use the React Native DevTools in Safari, or `npx react-native log-ios`.
- Android: use `adb logcat` and the React Native DevTools.

Both platforms use the same JS bundle, so any JS-level error in `App.tsx` is the same on every platform.
