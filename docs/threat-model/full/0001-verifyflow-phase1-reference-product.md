# 0001 VerifyFlow Neutral KYC Measurement Threat Model

- Status: accepted
- Date: 2026-05-02
- Owners: repository maintainer

## Change summary

VerifyFlow adds a standalone product that measures KYC provider flows and grants product tiers from provider decisions.

## Assets

- VerifyFlow user accounts and sessions
- provider API client credentials
- provider bearer tokens
- provider run IDs
- one-time transfer payloads during user presentation
- verification results
- tier grants
- funnel and audit events

## Trust boundaries

- browser to VerifyFlow web
- VerifyFlow web to VerifyFlow API
- VerifyFlow API to Postgres
- VerifyFlow API to Auth.js session validation
- VerifyFlow API to provider token endpoint
- VerifyFlow API to provider check creation endpoint
- VerifyFlow API to provider verification endpoint
- VerifyFlow API to local mock provider adapter when `KYC_PROVIDER_MODE=mock`
- browser to local test Auth.js credentials provider when `VERIFYFLOW_TEST_AUTH_ENABLED=true`
- admin browser session to cross-user measurement endpoints

## Entry points and privileged actions

- user sign-in
- public landing page
- onboarding session creation
- provider check creation
- provider verification request
- tier grant creation
- enhanced-tier upgrade
- funnel summary read
- measurement summary read
- measurement sessions read

## Abuse and misuse cases

- attacker attempts to grant a tier without provider `allow`
- stolen provider client secret is used to create or verify checks
- browser attempts to call provider APIs directly
- replayed transfer payload is used outside intended user flow
- logs leak opaque artifacts, tokens, or normalized claims
- funnel telemetry becomes a shadow identity store
- denied or failed verification is treated as success
- mock provider mode is accidentally enabled in production
- local test auth is accidentally enabled in production
- non-admin user accesses cross-user measurement data
- measurement projections expose raw claims, artifacts, tokens, or full legal names
- tester assumes VerifyFlow is collecting document uploads or liveness media because the onboarding journey shows those provider-side checkpoints
- unauthenticated visitor attempts to read measurement or tester data through the public landing route

## Mitigations

- keep provider calls backend-only
- store provider secrets only in API runtime environment
- redact sensitive fields from logs
- store artifact digests, not raw artifacts, after request completion
- require provider `allow` before granting `verified` or `enhanced`
- fail closed on provider auth, check creation, verification, or database errors
- reject `KYC_PROVIDER_MODE=mock` when `NODE_ENV=production`
- reject `VERIFYFLOW_TEST_AUTH_ENABLED=true` when `NODE_ENV=production`
- require local test auth emails to be present in `VERIFYFLOW_INVITE_ALLOWLIST`
- use bounded funnel event names without raw payloads
- require invite allowlist for the first friends-and-family environment
- require `VERIFYFLOW_ADMIN_EMAILS` for cross-user measurement endpoints
- project pseudonymous identifiers and bounded metrics only in measurement responses
- keep the public landing page static except for sign-in actions and do not call measurement APIs before authentication
- show document and liveness as provider-side checkpoints only
- do not render file-upload or camera-capture controls in the onboarding journey
- continue rejecting raw media, document numbers, and free-form evidence in VerifyFlow API contracts

## Residual risks

- Provider artifacts are opaque and not cryptographically verified by VerifyFlow.
- Transfer payload handling remains less private than a later wallet presentation.
- Client credentials remain high-value secrets until rotation automation exists.
- Friends-and-family users may paste real personal data into support channels.
- Local mock artifacts are not real provider credentials but could still be mishandled if copied into public examples.
- Cross-user dashboards can still reveal operational behavior and should be limited to invited admins.
- Tester-facing visual checkpoints can still create confusion if support copy does not repeat that evidence collection belongs to the configured provider.

## Validation impact

Tests must cover:

- allow grants tier
- deny does not grant tier
- provider outages fail closed
- token acquisition failures fail closed
- idempotent retries do not duplicate tier grants
- sensitive payloads are not logged or persisted long-term
- mock mode is rejected in production configuration
- local test auth is rejected in production configuration
- non-admin measurement requests are rejected
- measurement responses exclude raw claims, artifacts, tokens, and full legal names
- public landing renders without unauthenticated API data
- onboarding renders no file inputs or camera capture controls
