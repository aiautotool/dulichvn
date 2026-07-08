# Native Builds (iOS / Android)

The web app runs in any browser. Native builds (`.ipa` for iOS, `.aab` / `.apk` for Android) require platform-specific configuration. This page documents what is currently set up in the repo and what still needs to be done before shipping a native build.

## iOS

### Current state

- `app.json` declares `ios.bundleIdentifier: "com.vinago.plus"` and `ios.googleServicesFile: "./GoogleService-Info.plist"`.
- `GoogleService-Info.plist` declares `BUNDLE_ID: "com.vinago.plus"` and is copied into `ios/Vinago/GoogleService-Info.plist` during Expo prebuild.
- The custom config plugin adds the plist's `REVERSED_CLIENT_ID` URL scheme and boots Firebase in `AppDelegate.swift` with `FirebaseApp.configure()`.
- Google Sign-In is native Firebase Auth. Web login is QR-only.

### Steps to produce a build

1. **Verify Firebase iOS app config**: `GoogleService-Info.plist` must have `BUNDLE_ID` set to `com.vinago.plus`.
2. **Regenerate native iOS files**: `npx expo prebuild --platform ios --no-install`.
3. **Install pods**: `cd ios && pod install --repo-update`.
4. **Configure signing in Xcode** if needed.
5. **Run** `npx expo run:ios --device` (debug device) or `npx expo run:ios --configuration Release --device` (release device).

### Known caveats

- Do not set `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`; iOS reads `CLIENT_ID` from `GoogleService-Info.plist`.
- If pods were installed before Firebase/static-framework changes, remove stale generated files and reinstall pods: `rm -rf ios/Pods ios/Podfile.lock ~/Library/Developer/Xcode/DerivedData/Vinago-*`, then run the pod install step again.
- The first run after prebuild will fail with a "no team" error if you have not opened the project in Xcode and selected a development team.

## Android

### Current state

- `app.json` currently declares `android.package: "com.vinago.dev"` and `android.googleServicesFile: "./google-services.json"`.
- The `android/` directory exists locally from prebuild output and is ignored by git.
- `google-services.json` targets package `com.vinago.dev`.
- Local release signing uses the ignored files `android/app/vinago-plus-upload.jks` and `android/keystore.properties`.
- `android/app/src/main/AndroidManifest.xml` declares:
  - `INTERNET`, `VIBRATE`, `SYSTEM_ALERT_WINDOW` permissions
  - `queries` for `https` browserable intents
  - `<activity android:name=".MainActivity">` with `android:screenOrientation="portrait"`
  - Deep-link intent filter for `vinagoplus` scheme
  - `predictiveBackGestureEnabled: false` (set in `app.json`)
- Adaptive icon: `assets/android-icon-{background,foreground,monochrome}.png` with background color `#DA251D`.

### Steps to produce a build

1. **Back up the release upload key** in `android/app/vinago-plus-upload.jks` and `android/keystore.properties`. These files are ignored by git and are required for future updates to the same Play Store app.
2. **Add the SHA-1 of your release signing key** to the Android OAuth client in Google Cloud Console.
3. **Run** `npm run typecheck`.
4. **Run** `cd android && ./gradlew :app:bundleRelease`.
5. **Use** `android/app/build/outputs/bundle/release/app-release.aab`, or copy it to `dist/android/` for handoff.

### `google-services.json`

The repo-level `google-services.json` and the prebuilt native copy at `android/app/google-services.json` should stay aligned. Both currently target `com.vinago.dev`.

If you replace Firebase projects, download fresh `google-services.json` and `GoogleService-Info.plist` files, then run Expo prebuild again. iOS must keep `GoogleService-Info.plist` aligned with `com.vinago.plus`.

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
