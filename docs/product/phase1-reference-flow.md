# Neutral KYC Measurement Flow

## Product tiers

- `basic`: signed-in user with no accepted KYC decision
- `verified`: configured provider returned `allow` for a basic KYC check
- `enhanced`: configured provider returned `allow` for a higher-level KYC check

## Core flow

1. User signs in.
2. User starts onboarding.
3. User submits normalized KYC claims.
4. VerifyFlow API starts a provider check through the configured adapter.
5. VerifyFlow returns a one-time provider presentation payload to the user.
6. User presents the payload in VerifyFlow.
7. VerifyFlow API asks the configured adapter for a verification decision.
8. Provider `allow` grants `verified`.
9. User requests enhanced tier.
10. VerifyFlow starts a higher-level provider check, supersedes the prior run when supported, verifies the new payload, and grants `enhanced`.

## Product rules

- Tier grants are derived from provider verification results only.
- Denied, failed, revoked, expired, superseded, or unknown provider runs do not grant or upgrade tiers.
- Re-verification requires user presentation of the current transfer payload.
- VerifyFlow does not interpret opaque artifacts as signed credentials or proofs.
