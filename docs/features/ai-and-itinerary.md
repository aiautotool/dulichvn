# AI Chat & Itinerary

The AI feature spans three screens: **AI** (chat + itinerary builder), **Itinerary Preview** (a styled plan ready to share), and **Itinerary PDF** (a plain-text export preview).

The "AI" itself is a deterministic, local intent matcher (`buildAiAnswer`) that pulls answers from the in-app catalogs. Real model integration is on the [Roadmap](../roadmap.md).

## AI Screen

### Screen Layout

- **Header:** "Vinago+ AI" + a green dot + "Trực tuyến" (Online) status.
- **Itinerary builder card:**
  - Title "Lập lịch trình" + subtitle.
  - Day stepper: `1 / 2 / 3 / 5` days. Default is 2.
  - Style chips: `Culture + Food / Relaxed / Family / Business`. Default is `Culture + Food`.
  - "Lên lịch trình" primary button.
- **Account panel:** shows the current Google profile if signed in, or a "Sign in to keep confirmations tied to your email" prompt otherwise.
- **Last itinerary card:** preview of `lastItinerary` with day count, style, and a "Send email" button.
- **Chat log:** the history of `askAi` calls. The first message (`id: 'welcome'`) is regenerated when the locale changes.
- **Locked module row:** four placeholders (AI Camera Guide, Voice Translation, Nearby with GPS, Unlimited AI).
- **Input row:** TextInput + send button. Submitting pushes a user message + assistant response and clears the input.

### Source Map

| Symbol | Purpose |
| --- | --- |
| `AiScreen` component | Renders the screen. |
| `buildItinerary` | Generates the confirmation and navigates to `itinerary_preview`. |
| `askAi` (in `App`) | Pushes user/assistant messages to the chat log. |
| `messages` state | In-memory chat history. |
| `lastItinerary` state | The most recent `ItineraryConfirmation`. |
| `tripDays` / `tripStyle` state | Builder inputs. |

## Itinerary Preview Screen

### Screen Layout

- Hero card with a tinted background, the title "Lịch trình của bạn", the subtitle, and chip row showing the day count + city + style.
- Itinerary body (plain text) inside a card.
- Two CTAs side by side: "Lưu" (Save) and "Gửi email" (Send email).
- "Xuất PDF" (Export PDF) tertiary action that switches to the [PDF preview](#itinerary-pdf-screen).

### Source Map

| Symbol | Purpose |
| --- | --- |
| `ItineraryPreviewScreen` component | Renders the preview. |
| `buildItineraryPreview` | The plain-text formatter used for the body and the PDF preview. |

## Itinerary PDF Screen

### Screen Layout

- A header showing the itinerary title in uppercase + the Vinago+ tagline.
- The full plain-text body inside a card.
- Two CTAs: "Chia sẻ" (Share, opens the OS mail composer) and "Tải PDF" (Download PDF, which fires `itinerary_exported` with `format: 'pdf_export'`).

> The PDF export is a placeholder. The Share action opens `mailto:?subject=...&body=...` with the formatted text. Real PDF generation would require `react-native-html-to-pdf` or a server-side renderer.

## `buildAiAnswer` (the local "AI")

A simple keyword matcher over the in-app catalogs. The order matters:

1. **Place match** — if the lower-cased question contains any `place.name` (lower-cased), return a templated description, best-time, and tip. The Vietnamese locale gets a Vietnamese template.
2. **Food match** — same, with a spice-level phrase ("not spicy", "usually mild", "often spicy") and the Vietnamese sentence from `howToOrder`.
3. **Keyword fallbacks** — broader patterns:
   - "cross the street" / "traffic" → traffic-culture tips.
   - "temple" / "pagoda" → temple-etiquette tips.
   - "bargain" / "market price" → bargaining tips.
   - "itinerary" / "plan" / "days" / "行程" / "lịch trình" → returns a sample itinerary that varies by `tripDays` and `tripStyle` (with Vietnamese variants).
   - "translate" / "dịch" / "번역" → returns a one-line translation tip and a list of common greetings.
   - Default → returns the local `getWelcomeMessage(locale)`.

The function does not call any network. It is intentionally fast and offline-safe.

## Email Flow

The "Gửi email" button on either the AI screen or the preview screen:

- If `authSession` is missing, shows the localized `email.signInRequired` status.
- If `EXPO_PUBLIC_ITINERARY_EMAIL_ENDPOINT` is set **and** Firebase Auth can provide a fresh ID token, the app POSTs `{ to, name, itinerary, profile }` to the endpoint with header `Authorization: Bearer <firebaseIdToken>`:
  - On a 2xx response, fires `itinerary_email_sent` (`delivery_mode: 'endpoint'`) and shows `email.sent`.
  - On a non-2xx response, fires `itinerary_email_failed` and shows `email.failed`.
  - Records `email` activity either way.
- Otherwise the app falls back to `expo-mail-composer`:
  - If `MailComposer.isAvailableAsync()` is `false`, shows `email.unavailable` and does not fire any `itinerary_email_*` event.
  - Otherwise calls `MailComposer.composeAsync` with the same subject and body the Worker would send, and fires `itinerary_email_sent` with `delivery_mode: 'mail_composer'` and `composer_status` set to the result of the composer.
  - If the composer call throws, fires `itinerary_email_failed` and shows `email.failed`.

## Tracked Events

| Event | Trigger | Key params |
| --- | --- | --- |
| `ai_question_submitted` | Any `askAi` call (including search, place detail chips, food detail chips) | `question_length`, `response_locale`, `source_screen`, `trip_style` |
| `itinerary_generated` | "Generate itinerary" button | `trip_days`, `trip_style`, `current_city` |
| `itinerary_saved` | "Save" CTA on the preview | `itinerary_days` |
| `itinerary_exported` | "Export PDF" CTA or "Tải PDF" | `itinerary_days`, `format` (`pdf_preview` or `pdf_export`) |
| `itinerary_email_requested` | User taps "Email confirmation" and a path is chosen | `itinerary_days`, `itinerary_style`, `email_domain`, `delivery_mode` |
| `itinerary_email_sent` | Worker returns 2xx **or** `MailComposer.composeAsync` resolves | `itinerary_days`, `delivery_mode`, `email_domain`; composer path also includes `composer_status` |
| `itinerary_email_failed` | Worker returns non-2xx, the composer throws, or the sign-in check fails | `itinerary_days`, `email_domain` |
| `google_sign_in_started` / `google_sign_in_completed` / `google_sign_in_failed` | Auth flow on this screen | varies |
| `google_signed_out` | "Đăng xuất" button on the account panel | `source_screen`, `email_domain` |

## Edge Cases

- The chat history is in-memory; it resets when the app reloads. The `lastItinerary` is also in-memory.
- `buildAiAnswer` falls back to English for English and Vietnamese locales. Other locales (currently not enabled) would also fall back to English.
- The email body sent by the Worker is built from `itinerary.body`, which is the same text shown in the chat. The Worker prefixes it with a greeting, plan, purpose, language, and creation timestamp.
- The "Send email" CTA appears on the AI screen only when `lastItinerary` exists; otherwise the user must generate one first.
