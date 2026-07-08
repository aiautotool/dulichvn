# Google Play Billing for Live Preview

Vinago+ now pays per live session instead of using wallet top-up.

## Product

Create this product in Google Play Console:

- Product type: One-time product / consumable
- Product ID: `live_preview_session_1`
- Suggested price: `$0.99`, `$1.49`, or `$1.99`

The app treats this as a consumable session purchase. After a successful purchase the provider calls `finishTransaction(..., isConsumable: true)` so the traveler can buy another live preview later.

## Runtime flow

```text
SHOW ME NOW
  -> Google Play Billing purchase
  -> purchase token returned
  -> create LivePreviewRequest
  -> capture purchase into internal escrow state
  -> broadcast new job to helpers/all app users
  -> helper accepts
  -> live call completes
  -> helper earning is credited internally
```

## Important production requirement

The current app code includes a native Google Play Billing provider and a demo fallback provider.

For production:

1. Install and configure the native billing dependency:

```bash
npm install react-native-iap
```

2. Use a development build or release build. Expo Go cannot test native Play Billing.

3. Set:

```bash
EXPO_PUBLIC_ENABLE_REAL_GOOGLE_PLAY_BILLING=true
```

4. Verify the purchase token on a trusted backend before publishing the job.

The client-side provider can collect a purchase token, but production security requires backend verification using the Google Play Developer API. Do not trust only the client.

## Why no top-up wallet?

The live preview payment is now pay-per-session. This avoids selling coins, credits, or a stored wallet balance inside the Android app.

## Helper payout

Google Play pays the app owner. Helper payout is still handled separately through the internal helper earning ledger. In production this should later connect to manual payout, bank transfer, MoMo, or another payout system.
