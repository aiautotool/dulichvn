# AI Camera and OCR Translate

Vinago+ uses `expo-camera` on the device and a Cloudflare Worker proxy backed by `gemini-3.5-flash`, with stable `gemini-3.1-flash-lite` as the low-latency fallback when the free 3.5 pool is busy. The Gemini key never ships in the Expo bundle.

## Why Gemini 3.5 Flash

- One multimodal request covers food, landmark and sign recognition, OCR and translation.
- It has a free tier for development and light usage.
- Structured JSON output keeps the mobile UI predictable.
- The model is stable rather than a preview model.
- Transient 404/429/503 responses retry briefly and automatically fall back to Flash-Lite.

Free-tier prompts may be used by Google to improve its products. Do not photograph passports, payment cards, medical records or other sensitive documents. Review current quota and data terms before production launch.

## Configure the secret

Create a free API key in Google AI Studio, then store it only in Cloudflare:

```bash
npx wrangler secret put GEMINI_API_KEY
```

For local Worker development, create an ignored `.dev.vars` file:

```dotenv
GEMINI_API_KEY=your-key
```

Optional Expo configuration:

```dotenv
EXPO_PUBLIC_AI_VISION_ENDPOINT=https://vinago.aiautotool.com/api/ai/vision
```

If this variable is omitted, the app defaults to the production Vinago+ endpoint.

## Request flow

1. The user explicitly opens the camera and grants permission.
2. `CameraView.takePictureAsync` captures a compressed JPEG with base64 data.
3. The app posts the image, mode, city and output locale to `/api/ai/vision`.
4. The Worker validates type and size, removes any data-URL prefix, and calls Gemini over HTTPS.
5. Gemini returns structured fields for summary, OCR, translation, confidence, safety and price hints.

The Worker limits the request body to roughly 8 MB. The client times out after 25 seconds and presents quota, permission and network errors without falling back to fake recognition results.

## Production controls

Before public scale, add a Cloudflare rate-limiting rule for `/api/ai/vision`, set a Google AI Studio project budget/quota, and move to Gemini paid tier if images must not be used for product improvement. Do not log image payloads.
