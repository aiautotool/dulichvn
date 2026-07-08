# Cloudflare Worker

The Cloudflare Worker is the small backend that powers the email-confirmation flow. It is intentionally minimal: one route, one secret, one upstream.

## Configuration (`wrangler.jsonc`)

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "vinago-plus",
  "main": "./src/worker.ts",
  "compatibility_date": "2026-06-19",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application",
    "binding": "ASSETS",
    "run_worker_first": ["/api/*"]
  },
  "vars": {
    "ITINERARY_EMAIL_FROM": "Vinago+ <itinerary@aiautotool.com>"
  },
  "routes": [
    { "pattern": "vinago.aiautotool.com", "custom_domain": true }
  ]
}
```

| Field | Why it matters |
| --- | --- |
| `main` | Entry point. The Worker is exported as default from `src/worker.ts`. |
| `compatibility_date` | Pins the Workers runtime to a specific date. Update when you upgrade the Wrangler version. |
| `assets.directory` | Path to the Expo web export output. |
| `assets.not_found_handling` | `single-page-application` means unknown paths return `index.html`, which is what an Expo router-less SPA expects. |
| `assets.binding` | The binding name used inside the Worker (`env.ASSETS`). |
| `assets.run_worker_first` | `["/api/*"]` means requests under `/api` hit the Worker before any static-asset fallback. |
| `vars.ITINERARY_EMAIL_FROM` | Sender identity used by the Resend call. |
| `routes[0]` | Custom domain. Requires the DNS record to be proxied through Cloudflare. |

The Worker does not have a `[secrets]` block; `RESEND_API_KEY` is set with `wrangler secret put` after deploy.

## Source (`src/worker.ts`)

The full file is ~170 lines. The exported handler:

```ts
export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/itinerary-email') {
      return handleItineraryEmail(request, env);
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
```

Helpers:

- `corsHeaders(request)` — reflects the `Origin` and allows `POST, OPTIONS` with `Authorization, Content-Type`.
- `jsonResponse(body, status, request)` — wraps a body in `corsHeaders` + `Content-Type: application/json; charset=utf-8`.
- `decodeJwtPayload(token)` — splits the token on `.`, base64-decodes the payload, and returns it as JSON. **No signature check** — see Security Notes below.
- `buildPlainTextEmail(payload, fallbackEmail)` — assembles the plain-text email body.

`handleItineraryEmail` walks the validation chain described in [Itinerary Email](./itinerary-email.md).

## TypeScript

`tsconfig.json` adds `@cloudflare/workers-types` so the Worker benefits from typed `ExportedHandler`, `Fetcher`, and the standard `Request` / `Response` / `URL` globals.

## Security Notes

- The Google ID token is **not** cryptographically verified by the Worker. It only checks the `email_verified` claim and matches the recipient. A real production deployment should verify the JWT signature against Google's JWKS.
- QR web login sessions are stored in Worker runtime memory for this MVP. They are short-lived and fine for development, but production should move them to Durable Objects, KV, or D1 so sessions survive isolate eviction and can be rate-limited centrally.
- The Worker is reachable at `https://vinago.aiautotool.com/api/itinerary-email`. There is no rate limiting or abuse protection; the Google ID token check is the only gate. Add a rate limit or Turnstile check before opening the endpoint to the public.
- The Worker echoes the request `Origin` in `Access-Control-Allow-Origin`. This is fine for browser clients but means a malicious site could make a victim's browser send a request on their behalf; the email recipient must still match the token's `email`, so the worst case is that an attacker spams a victim's Google account email.
- `RESEND_API_KEY` is a Wrangler secret. Never commit it; never expose it to the client.

## Local Development

The Worker is not designed to be run locally with `wrangler dev` in this MVP — the bundled `scripts/deploy-cloudflare-global.sh` exports the Expo web build, then runs `wrangler deploy`. For interactive local testing:

```bash
npx wrangler dev --config wrangler.jsonc --local
```

You will need a `RESEND_API_KEY` available in your shell (`wrangler dev` reads `.dev.vars` or the active shell). For OAuth login, run `npx wrangler login` first.

## Observability

- `wrangler tail` streams the Worker's logs in real time.
- Each `fetch` is logged in the Cloudflare dashboard with method, path, status, and Ray ID.
- Errors from the Resend upstream are surfaced in the JSON response under `detail` so they can be debugged from the client.
