# Itinerary Email

The email-confirmation flow sends the user's generated itinerary to the email address tied to their Google account. It can be handled in one of two ways:

- **Endpoint configured and a Firebase ID token is available:** the app POSTs the itinerary to a backend (the bundled Cloudflare Worker) and the backend sends through Resend.
- **Otherwise:** the app opens the OS email composer (`expo-mail-composer`) with the itinerary prefilled.

The choice is driven by the `EXPO_PUBLIC_ITINERARY_EMAIL_ENDPOINT` env var and whether the native Firebase Auth session can provide `firebaseUser.getIdToken()`.

## Endpoint Contract

### Request

```
POST {EXPO_PUBLIC_ITINERARY_EMAIL_ENDPOINT}
Authorization: Bearer <firebaseIdToken>
Content-Type: application/json

{
  "to": "user@example.com",
  "name": "Alex",
  "itinerary": {
    "title": "2 day Culture + Food itinerary",
    "body": "<full plain-text itinerary, the same text shown in the chat>",
    "city": "Hanoi",
    "days": 2,
    "style": "Culture + Food",
    "createdAt": "2026-06-20T03:41:00.000Z"
  },
  "profile": {
    "language": "English",
    "purpose": "Travel",
    "currentCity": "Hanoi",
    "tripDays": 2
  }
}
```

### Response

| Status | Body |
| --- | --- |
| `200` | `{ ok: true, provider: 'resend', id: <resend-id> \| null }` |
| `400` | `{ error: 'Invalid JSON body' }` or `{ error: 'Missing itinerary content' }` |
| `401` | `{ error: 'Missing Google ID token' }` |
| `403` | `{ error: 'Google email is not verified' }` or `{ error: 'Recipient must match the Google account email' }` |
| `405` | `{ error: 'Method not allowed' }` |
| `502` | `{ error: 'Email provider rejected the request', detail: <text> }` |
| `503` | `{ error: 'Email provider is not configured' }` |

CORS: the Worker reflects the request `Origin` and allows `POST, OPTIONS` with `Authorization, Content-Type`. Preflight returns 200 with empty body.

## Worker Implementation

The Worker lives in `src/worker.ts` and is bound to the `vinago.aiautotool.com` custom domain via `wrangler.jsonc`. See [Cloudflare Worker](./cloudflare-worker.md) for the runtime and deployment details.

The high-level flow inside the Worker:

1. If the method is `OPTIONS`, return CORS preflight headers with an empty body.
2. If the method is not `POST`, return 405.
3. If `RESEND_API_KEY` is missing, return 503.
4. Read the `Authorization: Bearer <token>` header. If missing, return 401.
5. Decode the JWT payload (no signature check; see Security Notes below) and verify `email_verified === true` and a non-empty `email`. Otherwise return 403.
6. Parse the JSON body. On failure return 400.
7. Assert `payload.to` matches the token's `email` (case-insensitive). Otherwise return 403.
8. Assert `payload.itinerary.title` and `payload.itinerary.body` are present. Otherwise return 400.
9. POST to `https://api.resend.com/emails` with:
   - `Authorization: Bearer ${RESEND_API_KEY}`
   - Body: `{ from, to: [payload.to], subject, text }`
   - `from` is `env.ITINERARY_EMAIL_FROM ?? 'Vinago+ <itinerary@aiautotool.com>'`
   - `subject` is `Vinago+ itinerary confirmation: ${payload.itinerary.title}`
   - `text` is built by `buildPlainTextEmail(payload, tokenEmail)`.
10. Forward the upstream status: on 2xx, return 200 with the Resend id; on non-2xx, return 502 with the Resend error text.

## Fallback: OS Email Composer

When `EXPO_PUBLIC_ITINERARY_EMAIL_ENDPOINT` is unset, the app does not POST anywhere. Instead it builds the same text with `buildItineraryEmailBody` and calls:

```ts
await MailComposer.composeAsync({
  recipients: [authSession.user.email],
  subject: `Vinago+ itinerary confirmation: ${lastItinerary.title}`,
  body: buildItineraryEmailBody(authSession.user.name, lastItinerary, currentProfile),
});
```

If `MailComposer.isAvailableAsync()` returns `false`, the app shows the localized `email.unavailable` status and does not fire any `itinerary_email_*` event. The composer-unavailable case is treated as a UI-only failure, not an analytics failure.

## Email Body Format

The plain-text body has this shape:

```
Hi {name},

Here is your Vinago+ itinerary confirmation for {city}.

Plan: {title}
Purpose: {purpose}
Language: {language}
Created: {localized date}

{itinerary.body — same as the chat bubble}

Have a great trip,
Vinago+
```

The date is formatted with `toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })`.

## Tracked Events

| Event | Trigger |
| --- | --- |
| `itinerary_email_requested` | User taps "Email confirmation" and a path is chosen (Worker or composer) |
| `itinerary_email_sent` | Worker returns 2xx, **or** `MailComposer.composeAsync` resolves (`delivery_mode: 'mail_composer'`) |
| `itinerary_email_failed` | Worker returns non-2xx, `MailComposer` throws, or the sign-in check fails |

In all cases, an `email` activity row is appended to the activity history.

## Security Notes

- The Worker decodes the Google ID token without verifying its signature. This is sufficient to prevent trivial tampering with the recipient address (because the recipient is cross-checked against the token's `email` field), but it does not protect against a forged token. For production, verify the JWT signature against Google's JWKS and check `aud` and `iss` claims.
- The `email_verified` claim must be `true` for the request to proceed.
- The `to` field is case-insensitively compared to the token's `email` claim. Any mismatch returns 403.
- The `RESEND_API_KEY` is stored as a Wrangler secret; it is never visible to the client.

## Configuration Checklist

| Where | Variable | Required for |
| --- | --- | --- |
| Cloudflare (secret) | `RESEND_API_KEY` | Sending via Worker |
| Cloudflare (var, in `wrangler.jsonc`) | `ITINERARY_EMAIL_FROM` | Sender identity |
| Expo build (env) | `EXPO_PUBLIC_ITINERARY_EMAIL_ENDPOINT` | Tells the app which URL to POST to |
| Google Cloud Console | Resend sender domain verified | Production sending |

If the env var is missing, the app degrades to the OS composer — there is no hard failure.
