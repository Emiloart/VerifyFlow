# VerifyFlow

**Measure what KYC providers actually deliver, not what they promise.**

VerifyFlow is a provider-neutral infrastructure layer for testing, observing, and comparing real KYC verification flows.

KYC providers expose APIs, dashboards, documentation, and verification claims. Those surfaces do not necessarily tell a relying organization how a provider behaves across the complete user journey: onboarding, provider checks, returned presentations, verification decisions, re-checks, and access or tier upgrades.

VerifyFlow creates a controlled flow around those interactions and records the resulting behavior against a normalized contract.

## The problem

Choosing a KYC provider is usually based on capabilities the provider says it supports:

- identity verification
- document checks
- liveness
- risk decisions
- re-verification
- verification tiers
- account or product access

The harder question is what happens when those capabilities are exercised in a real product flow.

Two providers can claim the same capability while producing different outcomes, requiring different interaction patterns, or exposing different operational behavior.

VerifyFlow exists to make those differences measurable.

## What VerifyFlow measures

VerifyFlow is designed to observe provider behavior across a controlled, normalized flow, including:

- onboarding behavior
- provider checks
- provider presentation payloads
- verification decisions
- accepted and rejected states
- re-check behavior
- verification upgrades
- tier or product-access decisions
- provider-specific behavior behind a common contract

The goal is not to replace a KYC provider.

The goal is to provide an independent measurement layer around one.

## How it works

At a high level:

```
                    KYC PROVIDER
                         │
                         ▼
                Provider Adapter
                         │
                         ▼
             Normalized VerifyFlow
                    Contract
                         │
                         ▼
                Controlled Flow
                         │
                         ▼
              Observed Behaviour
                         │
                         ▼
              Evidence + Results
                         │
                         ▼
              Measurement / Comparison
```

A typical flow is:

1. A user starts a normalized VerifyFlow onboarding flow.
2. VerifyFlow invokes the configured provider adapter from the backend.
3. The user completes the provider's required interaction.
4. VerifyFlow receives and processes the provider presentation through the adapter boundary.
5. VerifyFlow requests the provider's verification decision.
6. The resulting behavior is evaluated against the neutral VerifyFlow contract.
7. Re-checks and verification upgrades use the same contract rather than provider-specific application logic.

This makes provider behavior observable without coupling the product to a provider's internal implementation.

## Provider neutrality

Provider neutrality is a core architectural invariant.

VerifyFlow interacts with KYC systems exclusively through configured provider adapters.

An adapter owns the translation between a provider's API and the normalized VerifyFlow contract. The rest of the system does not depend on provider-specific internals.

VerifyFlow must not:

- import provider internals
- read provider databases
- use hidden provider bypass modes
- expose provider credentials to browsers
- embed provider-specific assumptions into the core contract

This boundary is what allows the same measurement model to be applied across different providers.

## Architecture

```
VerifyFlow
│
├── apps/
│   └── web
│       Next.js App Router + Auth.js
│
├── services/
│   └── api
│       Fastify API
│       Provider integration boundary
│       Persistence access
│
├── packages/
│   ├── contracts
│   │   Shared TypeScript types, schemas, validators
│   └── config
│       Typed environment configuration
│
├── infra/
│   Local and deployment support
│
└── docs/
    Governance
    Product
    Architecture
    Privacy
    Threat model
    Runbooks
```

The default deployment model is:

- **Vercel** for the Next.js/Auth.js web application
- **Railway** for the Fastify API
- **Supabase** for PostgreSQL

The Railway API is the only runtime that communicates with KYC provider adapters and Supabase PostgreSQL.

## Design principles

### Normalize the contract, not the provider

Providers remain free to implement their own systems and APIs.

VerifyFlow standardizes the observable contract around those systems so that behavior can be measured consistently.

### Measure behavior, not marketing

Provider documentation describes intended capabilities.

VerifyFlow is concerned with what happens when those capabilities are exercised.

### Keep provider coupling at the boundary

Provider-specific logic belongs in adapters. The measurement model should remain provider-neutral.

### Preserve evidence

A measurement is only useful when its result can be tied back to the flow and provider interaction that produced it.

### Keep the core narrow

VerifyFlow is intentionally focused on KYC flow measurement. Additional capabilities should only be introduced when they strengthen that core purpose.

## Repository structure

| Path | Responsibility |
| --- | --- |
| `apps/web` | Web application |
| `services/api` | API and provider integration boundary |
| `packages/contracts` | Shared contracts, schemas, and validators |
| `packages/config` | Typed configuration |
| `infra` | Local and deployment infrastructure |
| `docs` | Product, architecture, security, privacy, governance, and operational documentation |

## Local validation

Install dependencies and run the complete validation suite:

```bash
npm install
npm run validate
```

Validation includes governance checks, secret scanning, linting, TypeScript type checking, and tests.

## Local mock run

The repository includes a local mock provider so the initial development loop does not require a real KYC provider sandbox.

```bash
cp .env.example .env
docker compose -f infra/local/docker-compose.yml up -d
npm run db:push -w services/api
npm run dev
```

Local runtime dependencies are documented in `docs/runbooks/local-dev.md`.

The remaining launch path is tracked in `docs/runbooks/launch-checklist.md`.

## Project status

VerifyFlow is under active development.

The current repository establishes the provider-adapter boundary, normalized contracts, local mock flow, and core application structure. Production readiness depends on completing the documented launch path and validating provider integrations under real operating conditions.

---

**VerifyFlow is not another KYC provider.**

It is the measurement layer around KYC providers.
