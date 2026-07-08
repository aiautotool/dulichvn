# Local Helper Marketplace

The marketplace is a common job layer for:

- `live_preview`
- `photo_request`
- `quick_question`
- `price_check`
- `place_status`

`LocalJobService` creates a common job with gross amount, helper amount, platform fee and state.

## State model

`open → accepted → in_progress → submitted → completed`

Alternative states:

- `cancelled`
- `disputed`
- `expired`

## Security rule expectation

Client code must not directly:

- change wallet balances
- mark payouts released
- overwrite helper reputation
- assign an accepted helper without a trusted transaction

Production job acceptance must run through a Firestore transaction or trusted backend endpoint.
