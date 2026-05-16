# Local Development Runbook

## Prerequisites

- Node.js 22+
- npm 10+
- Docker for local Postgres
- Linux Node inside WSL when running from `/mnt/c`
- at least one KYC provider sandbox, or `KYC_PROVIDER_MODE=mock` for local deterministic testing

## Setup

```bash
npm install
cp .env.example .env
docker compose -f infra/local/docker-compose.yml up -d
npm run db:push -w services/api
npm run dev
```

`npm run dev` loads `.env`, prefers an installed Linux Node 22 under `~/.nvm`, runs the API, and starts the web app on `0.0.0.0:3000`.
This avoids the WSL/Windows Node mismatch that can make Next advertise `localhost:3000` without a reachable WSL listener.

## Validation

```bash
npm run validate
```

## Provider dependency

Use `KYC_PROVIDER_MODE=mock` for local product-loop testing only.
Set `KYC_PROVIDER_MODE=http` and the provider adapter endpoint variables when measuring a real KYC provider.
Do not use hidden provider bypasses when measuring real user flows.
