# Repo Structure

## Purpose

This document records VerifyFlow repository boundaries and dependency direction.
Update it whenever the repository structure changes.

## Current state

VerifyFlow is a KYC flow measurement product scaffold.
It measures onboarding, provider check creation, presentation, verification, re-check, and tier upgrade through neutral provider adapters.

## Top-level directories

- `apps/`: user-facing applications
- `services/`: backend services and integration boundaries
- `packages/`: shared internal libraries
- `infra/`: local and deployment assets
- `docs/`: governance, architecture, product, runbooks, privacy, ADRs, plans, and threat models
- `scripts/`: repo-local validation and automation

## Runtime surfaces

- `apps/web`: Next.js web app for user onboarding, tier status, provider payload transfer, verification, and upgrade
- `services/api`: Fastify API for product state, provider adapter calls, funnel metrics, and tier grants
- `packages/contracts`: shared types, schemas, and validation helpers
- `packages/config`: typed environment helpers

## Dependency direction

Allowed:

- `apps/web` -> `services/api` HTTP API, `packages/contracts`, `packages/config`
- `services/api` -> configured KYC provider adapter, Postgres, `packages/contracts`, `packages/config`
- `packages/*` -> no app or service imports
- `infra` -> references services and deployment config only

Forbidden:

- `apps/web` must not call provider APIs directly.
- `apps/web` must not receive provider tokens or client secrets.
- `services/api` must not import provider internals or read provider databases.
- `services/api` must not use provider debug bypasses.
- `packages` must not contain hidden product policy or artifact verification authority.
- `infra` must not redefine provider trust, artifact, or tier logic.
