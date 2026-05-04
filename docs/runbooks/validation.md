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
