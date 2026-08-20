# Live Preview Wallet and Broadcast Job Flow

## Goal

The $1 Live Preview flow now uses an in-app wallet before publishing a job. A traveler must have enough available wallet balance before a live preview request can be escrowed.

## Traveler flow

1. Traveler opens a place detail page.
2. Traveler taps **Show Me Now / Live Preview**.
3. The request screen shows wallet balance and quick top-up buttons.
4. Traveler tops up balance.
5. Traveler pays $1 from wallet.
6. The app moves $1 from `availableCents` to `escrowedCents`.
7. The live preview request becomes `waiting_for_helper`.
8. A broadcast notification event is created for all app users/helpers.
9. The fastest eligible helper can accept the job.
10. When traveler confirms completion, escrow is released and helper reward is credited to the helper wallet.

## Important implementation notes

- `WalletService` is the only service that can mutate wallet balances.
- `PaymentEscrowService` checks wallet balance before creating the payment intent.
- `PaymentEscrowService.captureToEscrow()` moves traveler balance into escrow.
- `PaymentEscrowService.releaseToHelper()` releases escrow and credits helper payout.
- `PaymentEscrowService.refundTraveler()` returns escrow to traveler available balance.
- Demo top-up is implemented for development UX only. Production top-up should credit wallet only after App Store / Google Play billing, Stripe, PayPal, MoMo, ZaloPay, or bank payment confirmation.

## Broadcast notification

`BroadcastJobNotificationService` creates a `NEW_LIVE_PREVIEW_JOB` style event after escrow succeeds.

Current demo implementation records an in-memory broadcast event with audience:

```ts
audience: 'all_app_users'
```

Production implementation should map this to FCM/APNs topics, for example:

- `vinago_live_jobs_all`
- `vinago_live_jobs_helpers`
- `vinago_live_jobs_city_ho_chi_minh`
- `vinago_live_jobs_nearby_<geohash>`

The broad all-users topic satisfies the requirement that everyone who installed the app can know about the job quickly. A production version should also add throttling, city/geohash targeting, quiet hours, and abuse prevention so users are not spammed.

## Security notes

In production, clients must not directly edit wallet balances, payout status, or escrow state. These actions should run from a trusted backend or Firebase Cloud Functions after verifying Firebase ID tokens.

## User-to-user video calls

Native iOS and Android builds use LiveKit WebRTC rooms. The traveler and helper receive separate, short-lived join tokens for the same live-preview request room. The call UI supports remote/local video, microphone and camera toggles, camera switching, connection state, retry, and hang-up.

Configure the Worker before testing:

```bash
npx wrangler secret put LIVEKIT_URL
npx wrangler secret put LIVEKIT_API_KEY
npx wrangler secret put LIVEKIT_API_SECRET
npm run deploy:cloudflare
```

`FIREBASE_PROJECT_ID` is a non-secret Worker variable in `wrangler.jsonc`. The token endpoint verifies Firebase ID-token signatures and issues LiveKit tokens that expire after 15 minutes. Never add `LIVEKIT_API_SECRET` to an `EXPO_PUBLIC_` environment variable.

LiveKit requires native modules, so rebuild the app after installing or changing the LiveKit plugins:

```bash
npx expo prebuild
npm run ios
# or
npm run android
```

This feature is not available in Expo Go. The web build uses the LiveKit browser SDK and exchanges the signed-in QR web session for a short-lived, server-verifiable call credential. Browser users must allow camera and microphone access when joining.

On the website, open **Khám phá**, select a destination, choose **SHOW ME NOW — $1**, then join after a helper accepts the request. The accepted helper opens the same call from the local-helper jobs screen.
