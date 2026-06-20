# Deploying to Cloudflare

The web build of Vinago+ is exported to `dist/` and deployed as a Cloudflare Workers static-assets application. The Worker code in `src/worker.ts` is deployed at the same time, sharing the `vinago.aiautotool.com` custom domain.

This page describes the three deployment paths that are actually supported by this repo:

1. `npm run deploy:cloudflare` — recommended when you have a scoped API token.
2. `npm run deploy:cloudflare:global` — for the legacy global API key path.
3. Manual `wrangler deploy` — useful for iteration.

> **Before deploying the first time:** make sure `vinago.aiautotool.com` is added to your Cloudflare account, and the `aiautotool.com` zone is on Cloudflare. The deploy script will create/update the proxied DNS record automatically (AAAA `100::`, TTL 1, proxied).

## 1. Scoped API Token (recommended)

Set these in your shell before deploying:

```bash
export CLOUDFLARE_API_TOKEN=...
export EXPO_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX   # required to ship analytics in the web bundle
```

Then run:

```bash
npm run deploy:cloudflare
```

`package.json` maps this to:

```
npx wrangler deploy --config wrangler.jsonc
```

Wrangler will read `CLOUDFLARE_API_TOKEN` from the environment and deploy the Worker + assets together.

## 2. Legacy Global API Key

If you only have a global API key, avoid saving it in the repo. Use temporary shell variables:

```bash
export CLOUDFLARE_EMAIL=info@aiautotool.com
export CLOUDFLARE_API_KEY=...
export EXPO_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

If Wrangler opens OAuth instead of using the global key, use the guarded deploy script:

```bash
npm run deploy:cloudflare:global
```

This runs `scripts/deploy-worker.sh`, which:

1. Loads `.env.cloudflare.local` (gitignored) if present.
2. Accepts `EMAIL_CLOUDFLARE` / `EMAIL_CLOUDFALRE` / `GLOBAL_TOKEN_CLOUDFLARE` / `GLOBAL_TOKEN_CLOUDFALRE` as aliases for the email and key.
3. Validates that both `CLOUDFLARE_EMAIL` and `CLOUDFLARE_API_KEY` are set, otherwise prints usage and exits 1.
4. `exec`s `scripts/deploy-cloudflare-global.sh`.

`scripts/deploy-cloudflare-global.sh`:

1. Resolves the `CLOUDFLARE_ACCOUNT_ID` from `/accounts` (uses the first account if not set).
2. Resolves the `ZONE_ID` for `aiautotool.com`.
3. Looks up the existing AAAA record for `vinago.aiautotool.com`. If it exists, PATCHes it to `100::` (proxied). Otherwise POSTs a new AAAA record.
4. Runs `npm run export:web` to produce `dist/`.
5. Runs `npx --yes wrangler@4.103.0 deploy --config wrangler.jsonc` with the global-key env vars passed through.
6. Smoke-tests the deployed URL with `curl -I`.

## 3. Manual Wrangler

If you want to iterate without the scripts:

```bash
npm install
npm run export:web
npx wrangler deploy --config wrangler.jsonc
```

`npx wrangler login` will open a browser for OAuth when the env-var path is not used.

## 4. Worker Secret

After the first deploy, add the Resend API key as a Worker secret:

```bash
npx wrangler secret put RESEND_API_KEY
```

The secret is read at runtime inside `src/worker.ts` via `env.RESEND_API_KEY`. If it is missing, the endpoint returns 503 and the app shows `email.failed`.

## 5. Custom Domain

The custom domain is declared in `wrangler.jsonc`:

```jsonc
"routes": [{ "pattern": "vinago.aiautotool.com", "custom_domain": true }]
```

This requires:

- The `aiautotool.com` zone on Cloudflare.
- A proxied `AAAA 100::` record for `vinago.aiautotool.com` (the deploy scripts create/update it for you).

## 6. Rollback / Re-deploy

Re-running `npm run deploy:cloudflare` is safe and idempotent. To roll back to a previous version, use the Cloudflare dashboard (Workers → vinago-plus → Deployments) or `wrangler rollback`.

## 7. Caching & Invalidation

Cloudflare caches the static assets aggressively. If you change asset content and want to skip the cache, either:

- Append a query string to the URL.
- Purge the cache from the Cloudflare dashboard.
- Use the Wrangler `--keep-vars` / `--compatibility-date` flags when you want to force a fresh Worker version (Worker code is rolled immediately; assets keep their cache headers).

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| OAuth popup when running `deploy:cloudflare` | `CLOUDFLARE_API_TOKEN` is not set or is invalid | Set the token; for global key, use `deploy:cloudflare:global` |
| `Email provider is not configured` (503) | `RESEND_API_KEY` secret not set | `wrangler secret put RESEND_API_KEY` |
| `Recipient must match the Google account email` (403) | The `to` in the request is not the signed-in email | Use the same Google account or remove the `to` from the client request (the Worker will use the token's `email`) |
| Web app loads but assets are stale | Cloudflare edge cache | Purge from the dashboard or append a cache-buster |
| Wrangler says it cannot find `dist/` | `npm run export:web` was not run | Run `npm run export:web` first (the global script does this automatically) |
| DNS `AAAA` record not resolving | The proxied record was not created | Re-run the global script or create it manually in the Cloudflare dashboard |
