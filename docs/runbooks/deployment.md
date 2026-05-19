# Deployment Runbook

## Target

- Vercel deploys `apps/web`
- Railway deploys `services/api`
- Supabase hosts VerifyFlow Postgres

```text
User Browser
  -> Vercel: Next.js/Auth.js UI
  -> Railway: Fastify API
  -> Supabase: Postgres

Railway API
  -> KYC provider adapters
  -> Supabase Postgres
```

The browser must not call Supabase or KYC providers directly.
Provider credentials and the Supabase `DATABASE_URL` live in Railway API environment variables.
Vercel stores only web/Auth.js configuration and the VerifyFlow API base URL.

## API deploy requirements

- `DATABASE_URL`
- `PORT` from Railway, or `VERIFYFLOW_API_PORT` if overriding locally
- `VERIFYFLOW_WEB_ORIGIN`
- `VERIFYFLOW_WEB_API_TOKEN`
- `VERIFYFLOW_ADMIN_EMAILS`
- `KYC_PROVIDER_MODE=http`
- KYC provider issue/check endpoint
- KYC provider verification endpoint
- KYC provider token endpoint when OAuth is used
- separate provider credentials for check creation and verification when supported

Use the Supabase Postgres connection string for `DATABASE_URL`.
Run Drizzle migrations against Supabase before API startup.

## Web deploy requirements

- `NEXT_PUBLIC_VERIFYFLOW_API_BASE_URL`
- `VERIFYFLOW_WEB_API_TOKEN`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- Auth.js provider configuration
- invite allowlist
- matching `VERIFYFLOW_ADMIN_EMAILS` for admin navigation visibility

`VERIFYFLOW_WEB_API_TOKEN` must match the Railway API value and must remain server-side in Vercel.
Do not enable `VERIFYFLOW_TEST_AUTH_ENABLED` in deployed production environments.

## Production defaults

- HTTPS only
- strict CORS
- no debug logging
- no raw artifacts, tokens, secrets, or claims in logs
- no provider credentials or Supabase service-role credentials in Vercel
