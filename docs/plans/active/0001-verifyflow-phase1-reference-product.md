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
- admin-only measurement dashboard backed by real product data
- local mock KYC provider adapter for deterministic product-loop testing
- local test auth for browser E2E before Google OAuth is configured
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
- fake production dashboard metrics
- multi-provider comparison before the single-provider measurement dashboard is real and stable

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
- local development can use `KYC_PROVIDER_MODE=mock` before a real provider adapter is configured.
- local browser E2E can use `VERIFYFLOW_TEST_AUTH_ENABLED=true` with an invite-allowlisted email.
- cross-user measurement views require `VERIFYFLOW_ADMIN_EMAILS`.
- VerifyFlow uses separate provider credentials for check creation and verification when the provider supports that split.
- Auth.js with Google OAuth and an invite allowlist is the first product login model.
- Product tiers are `basic`, `verified`, and `enhanced`.
- Re-verification requires the user to present the current provider presentation payload.

## Risks

- VerifyFlow could become accidentally privileged if it uses provider local shortcuts.
- Funnel telemetry could leak sensitive data if event payloads are not bounded.
- Cross-user measurement dashboards could expose raw PII if query projections are not minimized.
- Browser code could expose provider credentials if integration is not backend-only.
- Tier grants could become stale if provider verification failures are treated as success.
- Long-term artifact storage could create unnecessary privacy risk.
- The mock provider could be mistaken for a real provider if environment gating is weak.
- Local test auth could become a production bypass if environment gating is weak.

## Validation steps

- `npm run governance`
- `npm run check:no-secrets`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run validate`
- `npm run test:e2e` after local services are running
- local mock issue -> verify -> upgrade -> old-run re-check
- authenticated local browser E2E for sign-in, onboarding, verification, and upgrade
- admin-only measurement endpoint tests for summary, sessions, and non-admin denial

## Rollback or containment notes

Rollback by removing the VerifyFlow standalone repo or reverting to a documentation-only skeleton.
If provider credentials leak, rotate affected provider clients immediately and inspect audit records.

## Open questions

- Whether the first deployed friends-and-family environment should use Vercel/Railway or a single VM after local validation.
- Whether enhanced-tier upgrade copy should be user-facing or operator-only for the first pilot.
