# VerifyFlow Platform Architecture

## Runtime shape

`apps/web` renders product flows and calls `services/api`.
`services/api` owns product state, provider adapter calls, funnel events, and tier grants.
Postgres stores VerifyFlow product data.

Admin users listed in `VERIFYFLOW_ADMIN_EMAILS` can view cross-user measurement summaries.
Non-admin users remain limited to their own tester flow and account tier state.

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

## Measurement console

The signed-in console prioritizes single-provider flow measurement first:

- total sessions, allow rate, average flow time, and open checks
- latest flow timeline from sign-in through tier unlock
- recent sessions with provider ID, decision, tier, elapsed time, and timestamp
- tier coverage and bounded funnel metrics

Multi-provider comparison is the next phase after the single-provider measurement dashboard is real and stable.
