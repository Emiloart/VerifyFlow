# 0002 Local Mock Provider Adapter

- Status: accepted
- Date: 2026-05-04
- Owners: repository maintainer

## Context

VerifyFlow needs a fast local loop before a real KYC provider adapter is configured.
The local loop must preserve the product boundary: the browser still calls VerifyFlow only, and VerifyFlow still grants tiers only from provider-adapter decisions.

## Decision

Add `KYC_PROVIDER_MODE=mock` for local deterministic testing.
The mock adapter implements the same `KycProviderClient` interface as HTTP providers and returns provider runs, presentation artifacts, verification decisions, and superseded states.

`KYC_PROVIDER_MODE=mock` is forbidden when `NODE_ENV=production`.

## Security impact

Positive for development because it removes the need for real provider credentials in local smoke tests.
Risk is bounded by the production guard and documentation that mock results are not real KYC decisions.

## Privacy impact

Positive.
The mock artifact stores only generated run metadata, tier level, timestamps, and status.
It does not store raw document evidence or real provider artifacts.

## Consequences

- Local development can test onboarding, verification, upgrade, and old-run supersede without external services.
- Real provider measurement still requires `KYC_PROVIDER_MODE=http` and server-side provider credentials.
- Any future provider-specific mock behavior needs a threat-model update if it changes artifact or decision semantics.
