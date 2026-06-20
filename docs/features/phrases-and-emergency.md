# Phrases & Emergency

The Phrases feature has two related screens: **Phrases** (a survival-Vietnamese phrasebook) and **Emergency** (a one-page list of important phone numbers).

## Phrases

### Screen Layout

- Horizontal situation filter row: `All / Greetings / Food / Emergency / Directions / Shopping`. The chips are hard-coded.
- Vertical list of phrase cards. Each card has:
  - English line (top, bold).
  - Vietnamese sentence (large, primary color).
  - Pronunciation (italic, primary color).
  - Audio placeholder button (right side, no-op in MVP).
  - Heart save button.

### Source Map

| Symbol | Purpose |
| --- | --- |
| `phrases` catalog | 15 phrases in the MVP, distributed across 5 situations. |
| `PhrasesScreen` component | Builds the situation list at render time. |
| `toggleFavorite('phrase', id)` | Save button. |

### Tracked Events

| Event | Trigger | Key params |
| --- | --- | --- |
| `favorite_added` / `favorite_removed` | Save button on a phrase card | `item_type: 'phrase'`, `item_id` |

The "Filter" event is fired from the situation chip handler (`filter_changed` with `filter_name: 'phrase_situation'`).

### Search Integration

The top-bar `SearchBox` filters `phrases` by English text, Vietnamese text, or situation name. The `search_submitted` event reports `result_phrase_count`.

### Audio Placeholder

Each phrase card has an audio button labeled "Âm thanh mẫu" (`phrases.audioPlaceholder`). It is a no-op in the MVP — real TTS is on the [Roadmap](../roadmap.md).

## Emergency

### Screen Layout

A dedicated screen reachable from the top bar (or directly via `activeTab = 'emergency'`). It is a vertical list of cards, each with:

- A category icon (left).
- Title + Vietnamese sentence (middle).
- Phone number in large red type (right).

### Numbers included

| Service | Number | Vietnamese sentence |
| --- | --- | --- |
| Police | 113 | "Cho tôi gọi cảnh sát." |
| Fire | 114 | "Có cháy, giúp tôi." |
| Ambulance | 115 | "Tôi cần xe cấp cứu." |
| Tourist Police | 1800 6118 | — |
| Tourist Hotline | 0588 247 247 | — |

These are hard-coded in the `emergencyCards` constant. The app does not dial them automatically; the user is expected to dial from the OS dialer.

### Tracked Events

The Emergency screen does not fire any analytics events. It is read-only.

## Edge Cases

- The `situation` filter list is hard-coded; the chip set is the same for both English and Vietnamese locales.
- The phrase search is case-insensitive and includes the situation name (so searching "taxi" or "Restaurant" both work).
- Adding a new emergency number is a one-line change in the `emergencyCards` array.
