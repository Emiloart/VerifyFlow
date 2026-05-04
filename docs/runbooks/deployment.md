# Deployment Runbook

## Target

- Vercel deploys `apps/web`
- Railway deploys `services/api`
- Railway hosts VerifyFlow Postgres

## API deploy requirements

- `DATABASE_URL`
- `VERIFYFLOW_WEB_ORIGIN`
- KYC provider issue/check endpoint
- KYC provider verification endpoint
- KYC provider token endpoint when OAuth is used
- separate provider credentials for check creation and verification when supported

Run Drizzle migrations before API startup.

## Web deploy requirements

- `NEXT_PUBLIC_VERIFYFLOW_API_BASE_URL`
- Auth.js provider configuration
- invite allowlist

## Production defaults

- HTTPS only
- strict CORS
- no debug logging
- no raw artifacts, tokens, secrets, or claims in logs
