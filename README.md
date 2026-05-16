# VerifyFlow

VerifyFlow is a standalone KYC flow measurement product.
It lets you test onboarding, provider checks, provider presentations, verification outcomes, re-checks, and tier upgrades against any KYC provider adapter.

The product flow is intentionally narrow:

1. A user signs in to VerifyFlow.
2. The user completes normalized onboarding.
3. VerifyFlow calls the configured KYC provider adapter from its backend.
4. The user carries the returned provider presentation payload.
5. VerifyFlow asks the provider adapter for a verification decision.
6. Provider `allow` decisions unlock product tiers.
7. Re-checks and upgrades use the same neutral VerifyFlow contract.

## Architecture

- `apps/web`: Next.js App Router web app
- `services/api`: Fastify API and KYC provider integration boundary
- `packages/contracts`: shared TypeScript types, schemas, and validators
- `packages/config`: typed environment loading helpers
- `infra`: local and deployment support
- `docs`: governance, product, architecture, privacy, threat model, and runbooks

## Core invariant

VerifyFlow consumes KYC providers only through configured provider adapters.
It must not import provider internals, read provider databases, use hidden bypass modes, or expose provider credentials to browsers.

## Local validation

```bash
npm install
npm run validate
```

## Local mock run

```bash
cp .env.example .env
docker compose -f infra/local/docker-compose.yml up -d
npm run db:push -w services/api
npm run dev
```

The default `.env.example` uses the local mock provider adapter, so the first local loop does not require a real KYC provider sandbox.

Local runtime dependencies are documented in `docs/runbooks/local-dev.md`.
