# AGENTS.md

## Mission

Build VerifyFlow as a neutral KYC flow measurement product.
VerifyFlow must evaluate KYC providers through explicit adapters and must not receive privileged access to any provider internals.

## Rule precedence

Apply rules in this order:

1. Security and privacy invariants
2. Accepted ADRs
3. Root governance docs
4. Active plan artifacts
5. Area-specific docs
6. Task-specific instructions

## Non-negotiables

- No provider database access.
- No provider internal package imports.
- No trusted-header, sandbox-only, or debug bypasses for provider calls.
- No browser calls directly to provider APIs.
- No provider client secrets, bearer tokens, raw artifacts, raw PII, or onboarding evidence in logs, fixtures, screenshots, or examples.
- No long-term storage of opaque provider artifacts.
- No tier grant unless the configured provider adapter returns an `allow` decision for the required tier.
- No public contract, auth, data model, or deployment change without docs and validation.
- No completion claim without truthful validation evidence.

## Before non-trivial changes

Read:

1. `docs/repo-structure.md`
2. relevant accepted ADRs in `docs/adr/`
3. relevant threat-model docs in `docs/threat-model/`
4. the relevant active plan in `docs/plans/active/`
5. `docs/privacy/README.md`

Create or update a plan before work that spans multiple files, changes auth, storage, provider integration, telemetry, or deployment.

## ADR gate

An ADR is required for:

- product boundary changes
- auth model changes
- provider integration contract changes
- tier decision model changes
- storage engine changes
- deployment topology changes
- production dependency additions with architectural impact
- privacy architecture changes

## Threat-model gate

Use a threat delta for moderate workflow, endpoint, telemetry, or deployment changes.
Use a full threat-model update for auth, trust-boundary, provider integration, artifact handling, or tier-decision changes.

## Validation

Run and report:

- `npm run governance`
- `npm run check:no-secrets`
- `npm run lint`
- `npm run typecheck`
- `npm run test`

Use `npm run validate` for the full local validation wrapper.
