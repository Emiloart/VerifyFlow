# Validation Runbook

## Full validation

```bash
npm run validate
```

## Focused validation

```bash
npm run governance
npm run check:no-secrets
npm run typecheck
npm run test
```

## E2E validation

Start web and API locally, then run:

```bash
npm run test:e2e
```

The first E2E smoke only checks unauthenticated sign-in rendering.
Provider-backed end-to-end tests require a configured provider sandbox and server-side credentials.

## Local mock-provider validation

Use `.env.example` as the base config and keep `KYC_PROVIDER_MODE=mock`.
The mock adapter is deterministic and supports active, expired, revoked-by-name, and superseded states without external provider credentials.
