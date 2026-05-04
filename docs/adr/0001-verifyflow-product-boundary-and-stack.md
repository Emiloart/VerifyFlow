# 0001 VerifyFlow Product Boundary And Stack

- Status: accepted
- Date: 2026-05-02
- Owners: repository maintainer

## Context

VerifyFlow exists to measure KYC flow usability, completion, decision outcomes, and upgrade behavior across providers.
It must stay provider-neutral so the same product can test a first-party integration, a partner provider, or a competing KYC vendor without special treatment.

## Decision

VerifyFlow is a standalone product repo with:

- Next.js App Router web app
- Fastify TypeScript API
- PostgreSQL with Drizzle migrations
- Auth.js for product login
- TanStack Query for web async state
- lucide-react for accessible command icons in the web app
- OpenTelemetry hooks
- first-party funnel events in Postgres
- Playwright and Vitest test coverage

VerifyFlow consumes KYC systems only through provider adapters.
Provider calls are server-side only.

## Alternatives considered

### Build inside a provider repository

Rejected because it weakens neutrality and makes internal coupling easier.

### Single-provider demo product

Rejected because the stated goal is measurement across KYC flows and providers.

### Third-party analytics first

Rejected for v1 because identity flows require bounded telemetry and privacy review.

## Security impact

Positive.
The boundary prevents direct provider internals access and keeps provider credentials out of the browser.

## Privacy impact

Positive with constraints.
VerifyFlow stores product state, decisions, and artifact digests only, and avoids long-term raw artifact storage.

## Migration / rollback

The product can be decommissioned without changing provider runtime systems.
If provider contracts change, VerifyFlow must update adapter code explicitly.

## Consequences

- VerifyFlow compares KYC provider behavior through a consistent product flow.
- Product tiers depend on provider decisions rather than local artifact interpretation.
- Local development requires one configured provider adapter.

## Open questions

- Whether later versions add provider-specific benchmarking dashboards.

## Related plans, PRs, and issues

- `docs/plans/active/0001-verifyflow-phase1-reference-product.md`
- `docs/threat-model/full/0001-verifyflow-phase1-reference-product.md`
