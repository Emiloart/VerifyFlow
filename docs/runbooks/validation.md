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

For the deterministic local mock flow, run:

```bash
npm run test:e2e:local
```

This starts local Postgres, applies the schema, starts VerifyFlow with mock provider mode and local test auth, and runs Chromium E2E tests.
Install the Linux Playwright browser first with `npx playwright install chromium`, or export `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to a Linux Chrome/Chromium binary.
Windows `chrome.exe` and `msedge.exe` are not valid WSL Playwright executables because remote debugging pipes are not available across that boundary.

## Local mock-provider validation

Use `.env.example` as the base config and keep `KYC_PROVIDER_MODE=mock`.
The mock adapter is deterministic and supports active, expired, revoked-by-name, and superseded states without external provider credentials.
