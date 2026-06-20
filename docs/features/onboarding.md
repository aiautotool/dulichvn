# Onboarding

The onboarding flow runs the very first time a user opens the app (or whenever they tap the language/profile reset button in the top bar). It is now a 3-step chooser behind a single welcome hero.

## What the User Sees

A single scrollable screen with:

1. **Welcome hero** — a full-bleed image card with a dark teal overlay, the Vinago+ logo, a "Chào mừng đến với Việt Nam! 🇻🇳" title, and two CTAs: a primary "Bắt đầu" and a secondary "Tôi đã có tài khoản" link.
2. **Language chooser** — six large `ChoiceChip`s for `English / Tiếng Việt` (with emoji flags), then a "Tiếp tục" button.
3. **Purpose chooser** — chip row for `Travel / Sightseeing / Food & Culinary / Culture & History / Văn hóa / Khác`, then a "Tiếp tục" button.
4. **City + days chooser** — day stepper (1/2/3/5) and a city chip row from the `onboardingCities` short list, then a "Bắt đầu" button.

## Source Map

- Screen code is in the `OnboardingScreen` function component in `App.tsx`.
- Step state: a `useState<0 | 1 | 2 | 3>` that drives the visible step.
- `draftProfile: UserProfile` (initialized to `defaultProfile`).
- Persistence: `AsyncStorage[PROFILE_KEY]` (key: `vinago-plus-profile`).
- Reset: `resetOnboarding()` in the top-bar language button.

## Tracked Events

| Event | When | Key params |
| --- | --- | --- |
| `onboarding_started` | First render with no profile (one-shot via `didTrackOnboardingRef`) | `screen_name: 'onboarding'` |
| `language_selected` | Every time the user picks a different language chip | `selected_language`, `selected_locale`, `source_screen` |
| `purpose_selected` | Every time the user picks a different purpose chip | `selected_purpose`, `source_screen` |
| `city_selected` | Every time the user picks a different city chip | `selected_city`, `source_screen` |
| `trip_days_selected` | Every time the user picks a different day count | `selected_trip_days`, `source_screen` |
| `onboarding_completed` | `saveProfile()` succeeds | `screen_name: 'onboarding'` |
| `profile_reset` | User taps the language/profile reset button from the main shell | `source: 'language_profile_button'` |

## Behavioral Details

- The first event tracked after boot is `app_opened`; the next is `onboarding_started`. The flag is stored in a `useRef` so it only fires once per launch even if the user navigates back into the flow.
- Every chip click immediately calls the corresponding `select*` helper, which updates `draftProfile` and fires the analytics event. There is no debounce.
- `saveProfile()`:
  1. Writes `draftProfile` to AsyncStorage.
  2. Promotes `draftProfile` to `profile`.
  3. Sets `selectedCity` to the new `currentCity` so the Explore filter matches the chosen city.
  4. Switches the active tab to `home`.
  5. Records `profile` activity and fires `onboarding_completed`.
- `resetOnboarding()`:
  1. Removes the profile from AsyncStorage.
  2. Clears `profile` so the onboarding branch renders again.
  3. Resets `draftProfile` to `defaultProfile`.
  4. Resets `didTrackOnboardingRef` and `previousScreenRef` so the analytics events fire again on the next visit.
  5. Fires `profile_reset`.

## Edge Cases

- If AsyncStorage read throws on boot, the loader falls back to `setProfile(null)`, so the user is treated as a first-time user.
- The `onboardingCities` short list intentionally excludes minor destinations (Sa Pa, Hà Giang, Mũi Né, etc.) to keep the first-run experience short. Users can still see those cities in the Explore screen filters and in the Saved screen.
- Trip days are clamped to the stepper values (1, 2, 3, 5). The stepper does not support custom values in the MVP.

## Related Docs

- [Data Models → UserProfile](../data-models.md#2-travel-profile)
- [Analytics reference](../integrations/google-analytics.md)
- [Localization](../localization.md) — the `onboarding.*` translation keys live in the in-file dictionary
