# Neutral KYC Measurement Flow

## Product tiers

- `basic`: signed-in user with no accepted KYC decision
- `verified`: configured provider returned `allow` for a basic KYC check
- `enhanced`: configured provider returned `allow` for a higher-level KYC check

## Core flow

1. Unauthenticated visitor sees the public VerifyFlow landing page and signs in.
2. Signed-in tester starts onboarding.
3. VerifyFlow derives account-created and email-confirmed steps from the Auth.js session.
4. Tester submits normalized KYC claims only.
5. VerifyFlow shows ID-document and liveness as provider-side checkpoints without file upload or camera capture.
6. VerifyFlow API starts a provider check through the configured adapter.
7. VerifyFlow returns a one-time provider presentation payload to the user.
8. User presents the payload in VerifyFlow.
9. VerifyFlow API asks the configured adapter for a verification decision.
10. Provider `allow` grants `verified`.
11. User requests enhanced tier.
12. VerifyFlow starts a higher-level provider check, supersedes the prior run when supported, verifies the new payload, and grants `enhanced`.

## Product rules

- Tier grants are derived from provider verification results only.
- Denied, failed, revoked, expired, superseded, or unknown provider runs do not grant or upgrade tiers.
- Re-verification requires user presentation of the current transfer payload.
- VerifyFlow does not interpret opaque artifacts as signed credentials or proofs.
- VerifyFlow does not collect document images, selfies, document numbers, phone numbers, addresses, or liveness media.
