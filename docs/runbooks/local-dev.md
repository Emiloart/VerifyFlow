# Local Development Runbook

## Prerequisites

- Node.js 22+
- npm 10+
- Docker for local Postgres
- Linux Node inside WSL when running from `/mnt/c`
- Playwright Chromium installed in WSL, or a Linux browser path exported as `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
- at least one KYC provider sandbox, or `KYC_PROVIDER_MODE=mock` for local deterministic testing

## Setup

```bash
npm install
npx playwright install-deps chromium
npx playwright install chromium
cp .env.example .env
docker compose -f infra/local/docker-compose.yml up -d
npm run db:push -w services/api
npm run dev
```

`npm run dev` loads `.env`, prefers an installed Linux Node 22 under `~/.nvm`, runs the API, and starts the web app on `0.0.0.0:3000`.
This avoids the WSL/Windows Node mismatch that can make Next advertise `localhost:3000` without a reachable WSL listener.

The default local env enables `VERIFYFLOW_TEST_AUTH_ENABLED=true` for browser testing.
It works only with an email in `VERIFYFLOW_INVITE_ALLOWLIST` and is rejected in production.
The same local tester is listed in `VERIFYFLOW_ADMIN_EMAILS` so the local measurement dashboard can be exercised with real mock-provider data.

## Validation

```bash
npm run validate
npm run test:e2e:local
```

## Provider dependency

Use `KYC_PROVIDER_MODE=mock` for local product-loop testing only.
Set `KYC_PROVIDER_MODE=http` and the provider adapter endpoint variables when measuring a real KYC provider.
Do not use hidden provider bypasses when measuring real user flows.
