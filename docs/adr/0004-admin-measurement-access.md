# 0004 Admin Measurement Access

- Status: accepted
- Date: 2026-05-19
- Owners: repository maintainer

## Context

VerifyFlow needs cross-user measurement views for pilot operators to inspect completion, decisions, timing, and tier outcomes.
Those views aggregate sensitive operational identity-flow metadata and must not be visible to every invited tester.

## Decision

Add an admin authorization boundary for measurement views and endpoints.
Admin users are configured by `VERIFYFLOW_ADMIN_EMAILS`.
The API enforces admin access for cross-user measurement endpoints, and the web app uses the same email list only for navigation and route visibility.

Measurement responses must project pseudonymous identifiers and bounded flow metadata only.
They must not include emails, full legal names, raw onboarding claims, raw provider artifacts, tokens, or client secrets.

## Security Impact

Positive.
Cross-user measurement data is separated from normal tester access and enforced by the API rather than the UI alone.

## Privacy Impact

Positive with constraints.
The dashboard intentionally limits data to provider IDs, provider run IDs, decisions, tiers, timestamps, durations, and aggregate counts.

## Consequences

- Operators can measure real flows without fake production metrics.
- Non-admin testers retain access to their own tier and flow screens only.
- Multi-provider comparison remains a later phase after the single-provider measurement dashboard is real and stable.
