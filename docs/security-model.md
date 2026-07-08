# Security Model

## Authentication

Firebase UID is the canonical application identity.

Backend APIs must verify Firebase ID tokens. Raw Google OAuth tokens are not Vinago session tokens.

## Sensitive writes

The following must be server-controlled:

- wallet balance changes
- payout release
- reputation scores
- Reality Score documents
- forced job status transitions

## Client allowed writes

Clients may create user-owned requests and reports, but server rules must validate ownership and immutable fields.
