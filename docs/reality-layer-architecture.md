# Vinago+ Reality Layer Architecture

Product positioning: **Vinago+ — See Before You Go**.

The Reality Layer adds current, local-verified destination signals to the existing travel app. It is intentionally not a generic hotel/flight/booking feature set.

## Core modules

- `src/features/reality-layer/types.ts` — shared domain models.
- `LocationValidationService` — proximity checks and impossible-jump detection.
- `RealityScoreService` — time-decayed score calculation.
- `ShouldIGoNowService` — deterministic travel decision engine.
- `PriceCheckService` — median/percentile based tourist price analysis.
- `ScamRadarService` — nearby active risk aggregation.
- `HelperReputationService` — configurable helper score and level.
- `LocalJobService` — common local micro-job abstraction.
- `RealityLayerCards.tsx` — reusable UI cards for Place Detail.

## Canonical identity

All production persistence should use Firebase UID as canonical user identity. Google OAuth tokens are not app sessions and should only be used for Google APIs when explicitly needed.

## Firestore target collections

- `users/{uid}`
- `places/{placeId}`
- `placeRealityStatus/{statusId}`
- `verifiedPlacePhotos/{photoId}`
- `localJobs/{jobId}`
- `quickQuestions/{questionId}`
- `priceReports/{reportId}`
- `scamReports/{reportId}`
- `helperReputation/{uid}`
- `realityScores/{placeId}`
- `wallets/{uid}`
- `walletTransactions/{transactionId}`

## Current implementation state

This implementation introduces the shared architecture and adds the first Place Detail UI entry points using deterministic demo data. The services are production-shaped and can be wired to Firestore repositories without changing the UI contract.

## Next backend step

Implement Firestore repositories and server-side functions for:

1. Transactional local job acceptance.
2. Payment hold/release.
3. Photo capture metadata verification.
4. Reality Score recalculation.
5. Helper reputation recalculation.
