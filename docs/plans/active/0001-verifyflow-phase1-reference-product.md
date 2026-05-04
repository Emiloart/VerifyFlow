# 0001 VerifyFlow Neutral KYC Measurement Product

- Status: active
- Date: 2026-05-02
- Owners: repository maintainer

## Objective

Build VerifyFlow as a standalone product for measuring KYC flow completion, provider decisions, re-checks, and tier upgrades through neutral provider adapters.

## Scope

- governance spine
- product boundary documentation
- architecture documentation
- threat model and privacy rules
- npm workspace scaffold
- Next.js web app
- Fastify API
- shared contracts and config packages
- Drizzle/Postgres schema
- first-party funnel events
- local and deployment runbooks

## Out of scope

- wallet flows
- QR codes
- short-token resolvers
- provider-run-ID-only verification
- selective disclosure
- proof verification
- mobile apps
- provider internal package imports
- provider database access
- third-party session replay or broad analytics

## Affected files, services, or packages

- `apps/web`
- `services/api`
- `packages/contracts`
- `packages/config`
- `infra`
- `docs`
- `scripts`
- `tests/e2e`

## Assumptions

- VerifyFlow is standalone at `/mnt/c/dev/verifyflow`.
- at least one provider sandbox or API adapter is available.
- VerifyFlow uses separate provider credentials for check creation and verification when the provider supports that split.
- Auth.js with Google OAuth and an invite allowlist is the first product login model.
- Product tiers are `basic`, `verified`, and `enhanced`.
- Re-verification requires the user to present the current provider presentation payload.

## Risks

- VerifyFlow could become accidentally privileged if it uses provider local shortcuts.
- Funnel telemetry could leak sensitive data if event payloads are not bounded.
- Browser code could expose provider credentials if integration is not backend-only.
- Tier grants could become stale if provider verification failures are treated as success.
- Long-term artifact storage could create unnecessary privacy risk.

## Validation steps

- `npm run governance`
- `npm run check:no-secrets`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run validate`
- `npm run test:e2e` after local services are running

## Rollback or containment notes

Rollback by removing the VerifyFlow standalone repo or reverting to a documentation-only skeleton.
If provider credentials leak, rotate affected provider clients immediately and inspect audit records.

## Open questions

- Whether the first deployed friends-and-family environment should use Vercel/Railway or a single VM after local validation.
- Whether enhanced-tier upgrade copy should be user-facing or operator-only for the first pilot.
