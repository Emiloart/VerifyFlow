# VerifyFlow Platform Architecture

## Runtime shape

`apps/web` renders product flows and calls `services/api`.
`services/api` owns product state, provider adapter calls, funnel events, and tier grants.
Postgres stores VerifyFlow product data.

## Provider integration

VerifyFlow API uses a `KycProviderClient` interface:

- `startCheck` for creating a provider-side KYC check or reusable artifact
- `verifyPresentation` for converting a user presentation into a provider decision
- `supersedeRun` for upgrade flows when a provider supports explicit supersession

The web app never receives provider credentials or tokens.

## Data minimization

VerifyFlow stores provider run IDs, verification IDs, decisions, reason codes, timestamps, and artifact digests.
It avoids long-term storage of raw opaque artifacts and does not store raw document evidence.
