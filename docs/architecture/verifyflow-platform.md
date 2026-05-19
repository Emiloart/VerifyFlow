# VerifyFlow Platform Architecture

## Runtime shape

Default deployment topology:

```text
User Browser
  -> Vercel: Next.js/Auth.js UI
  -> Railway: Fastify API
  -> Supabase: Postgres

Railway API
  -> KYC provider adapters
  -> Supabase Postgres
```

`apps/web` renders product flows on Vercel and calls `services/api`.
`services/api` runs on Railway and owns product state, provider adapter calls, funnel events, and tier grants.
Supabase Postgres stores VerifyFlow product data.

Admin users listed in `VERIFYFLOW_ADMIN_EMAILS` can view cross-user measurement summaries.
Non-admin users remain limited to their own tester flow and account tier state.
Unauthenticated users see only the public landing page with sign-in calls to action, product explanation, and trust-boundary copy.
The public page must not call measurement APIs or show unauthenticated operational data.

## Provider integration

VerifyFlow API uses a `KycProviderClient` interface:

- `startCheck` for creating a provider-side KYC check or reusable artifact
- `verifyPresentation` for converting a user presentation into a provider decision
- `supersedeRun` for upgrade flows when a provider supports explicit supersession

The web app never receives provider credentials or tokens.

## Data minimization

VerifyFlow stores provider run IDs, verification IDs, decisions, reason codes, timestamps, and artifact digests.
It avoids long-term storage of raw opaque artifacts and does not store raw document evidence.
Measurement dashboards project pseudonymous user/session identifiers only and must not include raw claims, artifacts, tokens, or full legal names.
The onboarding UI may show ID-document and liveness checkpoints as provider-side steps, but VerifyFlow does not collect files, photos, document numbers, camera streams, phone numbers, or addresses.

## Measurement console

The signed-in console prioritizes single-provider flow measurement first:

- total sessions, allow rate, average flow time, and open checks
- latest flow timeline from sign-in through tier unlock
- recent sessions with provider ID, decision, tier, elapsed time, and timestamp
- tier coverage and bounded funnel metrics

Multi-provider comparison remains deferred until the single-provider measurement dashboard is real and stable.

## Tester onboarding

The signed-in tester onboarding journey uses six visible steps:

1. Account created from the Auth.js session.
2. Email confirmed from the Auth.js session.
3. Personal information collected as existing normalized claims only.
4. ID document shown as a provider-side checkpoint.
5. Liveness shown as a provider-side checkpoint.
6. Verification handoff with provider run ID, target tier, expiry, payload, and verification actions.

Steps 4 and 5 are intentionally visual checkpoints.
They communicate where a configured provider may collect evidence, but VerifyFlow itself does not render upload or camera controls.
