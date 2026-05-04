# Local Development Runbook

## Prerequisites

- Node.js 22+
- npm 10+
- Docker for local Postgres
- at least one KYC provider sandbox or mock-compatible adapter target

## Setup

```bash
npm install
cp .env.example .env
docker compose -f infra/local/docker-compose.yml up -d
npm run db:push -w services/api
npm run dev
```

## Validation

```bash
npm run validate
```

## Provider dependency

Set VerifyFlow API env vars to the provider adapter endpoints.
Do not use hidden provider bypasses when measuring real user flows.
