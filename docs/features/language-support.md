# Language Support

The Language Support screen is a dedicated picker reachable from the Account tab. It lists every supported language with its flag, native name, and a check mark for the active selection.

## Screen Layout

- **Header:**
  - "Ngôn ngữ" (Language) title.
  - "Chọn ngôn ngữ sử dụng trong ứng dụng" (Choose the language used in the app) subtitle.
- **Body:** a vertical list of language rows. Each row has:
  - A flag emoji inside a soft-tinted square.
  - The language name (`English` / `Tiếng Việt`).
  - A check mark on the right when the row is the active selection.
- **Footer:** "Xong" (Done) primary button that returns to the Account tab.

Tapping a row calls `onSelect(language)`, which updates the profile and persists it.

## Source Map

| Symbol | Purpose |
| --- | --- |
| `LanguageScreen` component | Renders the picker. |
| `languages` constant | The 2 supported languages: `English`, `Vietnamese`. |
| `selectLanguage` (in `App`) | Updates the profile + fires `language_selected`. |
| `localeByLanguage` | Maps `Language` to `Locale`. |

## Tracked Events

| Event | Trigger | Key params |
| --- | --- | --- |
| `language_selected` | Tapping a language row | `selected_language`, `selected_locale`, `source_screen: 'account'` (when reached from Account) or `source_screen: 'onboarding'` (when reached from the reset flow) |

## Edge Cases

- The picker is intentionally small (2 entries) for the MVP. Adding a new language requires updates in three places: `Language` union, `localeByLanguage`, `languageLabels`, and the `translations` dictionary. See [Localization](../localization.md) for the full checklist.
- The selection persists immediately (in AsyncStorage) when the row is tapped, before the user dismisses the screen.
