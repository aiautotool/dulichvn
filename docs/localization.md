# Localization

Vinago+ is designed as a multilingual-first product. This page documents what the codebase actually does today, and what is on the roadmap.

## Supported Languages (shipped)

| Language | `Language` | `Locale` | Translation coverage in MVP |
| --- | --- | --- | --- |
| English | `English` | `en` | Full (`translations.en`) |
| Vietnamese | `Vietnamese` | `vi` | Full (`translations.vi`) |
| Korean | `Korean` | `ko` | Stub — falls back to English at lookup |
| Japanese | `Japanese` | `ja` | Stub — falls back to English at lookup |
| Chinese (Simplified) | `Chinese` | `zh` | Stub — falls back to English at lookup |
| French | `French` | `fr` | Stub — falls back to English at lookup |

Mapping is defined once in `App.tsx`:

```ts
const localeByLanguage: Record<Language, Locale> = {
  English: 'en',
  Vietnamese: 'vi',
  Korean: 'ko',
  Japanese: 'ja',
  Chinese: 'zh',
  French: 'fr',
};
```

## Lookup Mechanism

`translations` is a single object keyed by locale:

```ts
const translations = {
  en: { /* full dictionary */ },
  vi: { /* full dictionary */ },
  ko: {}, ja: {}, zh: {}, fr: {},
} satisfies Record<Locale, Partial<Record<string, string>>>;

function translate(locale: Locale, key: TranslationKey) {
  const dictionary = translations[locale] as Partial<Record<TranslationKey, string>>;
  return dictionary[key] ?? translations.en[key] ?? key;
}
```

- The active locale is derived from `profile.language` (with a fallback to `'en'`).
- A missing key in the active locale falls back to English, then to the key itself (which is human-readable like `'onboarding.start'`).
- `TranslationKey` is `keyof typeof translations.en`, so the compiler enforces that every key used in code exists in the English dictionary.

## What Is Localized Today

- Every UI label, button, empty state, status message, and section title shown in the rendered screens.
- The welcome AI message and most AI fallback responses (Vietnamese has a different phrasing path for place / food / traffic / temple / itinerary fallbacks).
- The "Today in Vietnam" copy on the Home screen (`getTodayCopy`).
- The Home info panel text for "Must-try dish" and "Culture tip" varies by `currentCity`.

## What Is Not Localized Yet

- The `places` and `foods` catalogs are English-only. Display names, descriptions, history, and travel tips are not translated.
- The `phrases` catalog is bilingual (English + Vietnamese) but the `pronunciation` is Latinized and not adapted for other scripts.
- The `cultureTopics` explanations are English-only.
- AI answers in non-`en` / non-`vi` locales fall back to English unless the question matches a Vietnamese-specific path.
- Analytics event titles, `getWelcomeMessage` non-`en`/`vi` paths, and the activity history titles are in English.

These are the next priority for translation, tracked in the [Roadmap](./roadmap.md).

## Language Selection

- The onboarding screen exposes a `ChoiceChip` per language.
- The top bar's "language" button and the Sidebar's "Profile" entry both call `resetOnboarding()`, which clears the profile and re-shows the language chooser.
- Changing the language is also possible mid-session from the profile reset flow; analytics events for `language_selected` include a `source_screen` of `'profile_settings'` or `'onboarding'`.

## Adding a New Language (UI only)

1. Add the `Language` union member and the `localeByLanguage` entry.
2. Add a `languageLabels` entry (the display name in its own script).
3. Add a new locale to `translations` and copy the keys from `translations.en`, translating as you go.
4. Run `npm run typecheck` to confirm `TranslationKey` still resolves.

## Adding a New Language (content)

1. Add per-locale fields to `Place` and `Food`, e.g. `name_vi`, `description_ko`.
2. Update the helpers (`buildAiAnswer`, `getTodayCopy`, the `Home` info panels) to read the per-locale field for the active language.
3. Translate the static `phrases` and `cultureTopics` arrays.

This refactor is a prerequisite for the multilingual-first product vision in `docs/product-blueprint.md`.

## Right-to-Left (RTL) Considerations

The current UI is LTR-only. The next time the layout is touched, consider:

- Wrapping directional styles (`flexDirection: 'row'`) with `I18nManager.isRTL` so Arabic / Hebrew additions flip correctly.
- Auditing `StyleSheet.create` for hard-coded `paddingLeft` / `paddingRight` (none in the current code — padding is symmetric, so the work is light).
