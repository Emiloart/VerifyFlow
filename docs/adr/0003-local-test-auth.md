# 0003 Local Test Auth

- Status: accepted
- Date: 2026-05-18
- Owners: repository maintainer

## Context

VerifyFlow needs browser-level end-to-end tests for the full product loop before a deployed Google OAuth application exists.
Using a hidden auth bypass would weaken the product boundary and make test results less representative.

## Decision

Add an Auth.js credentials provider named `local-test` that is enabled only when `VERIFYFLOW_TEST_AUTH_ENABLED=true`.
It accepts only an email already present in `VERIFYFLOW_INVITE_ALLOWLIST`.
If local test auth is enabled while `NODE_ENV=production`, the web app fails configuration at startup.

Google remains the intended pilot login provider.

## Security Impact

Positive for local validation because authenticated E2E tests no longer need real OAuth credentials.
The risk is bounded by the production guard and invite-allowlist requirement.

## Privacy Impact

Low.
The local test provider uses an email address only and does not collect passwords, identity evidence, or provider artifacts.

## Consequences

- Local E2E can validate sign-in, onboarding, provider check, verification, and upgrade.
- Production deployments must not set `VERIFYFLOW_TEST_AUTH_ENABLED=true`.
- Any future non-Google pilot auth provider requires a new ADR.
