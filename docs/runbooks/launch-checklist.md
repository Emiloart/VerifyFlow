# Launch Checklist

Use this checklist to move VerifyFlow from local build to a small invited tester circle.

## 1. Save Current Progress

- [ ] Commit current changes.
- [ ] Push `main` to GitHub.
- [ ] Confirm `git status --short --branch` is clean.

## 2. Local Confidence

- [ ] Resolve the Next SWC mismatch so `next` and `@next/swc-*` are both `16.2.6`.
- [ ] Install a working Playwright Chromium/headless shell.
- [ ] Run `npm run validate`.
- [ ] Run `npm run build`.
- [ ] Run `npm run test:e2e:local`.

## 3. Supabase Postgres

- [ ] Create the Supabase project.
- [ ] Copy the Postgres connection string for Railway `DATABASE_URL`.
- [ ] Run Drizzle migrations against Supabase from `services/api`.
- [ ] Confirm core tables exist: `users`, `onboarding_sessions`, `provider_runs`, `verification_attempts`, `tier_grants`, `funnel_events`, and `audit_events`.

## 4. Railway API

- [ ] Create a Railway service for `services/api`.
- [ ] Configure `DATABASE_URL`, `VERIFYFLOW_WEB_ORIGIN`, `VERIFYFLOW_WEB_API_TOKEN`, `VERIFYFLOW_ADMIN_EMAILS`, and `KYC_PROVIDER_MODE=http`.
- [ ] Configure provider token, issue, verify, supersede URLs, scopes, client IDs, and client secrets.
- [ ] Confirm Railway sets `PORT` and `/healthz` returns `{"status":"ok"}`.

## 5. Vercel Web

- [ ] Create a Vercel project for `apps/web`.
- [ ] Configure `NEXT_PUBLIC_VERIFYFLOW_API_BASE_URL`, `VERIFYFLOW_WEB_API_TOKEN`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `VERIFYFLOW_INVITE_ALLOWLIST`, and `VERIFYFLOW_ADMIN_EMAILS`.
- [ ] Confirm `VERIFYFLOW_TEST_AUTH_ENABLED` is not enabled in production.
- [ ] Confirm the public landing page loads without authenticated API data.

## 6. Google OAuth

- [ ] Create or update the Google OAuth app.
- [ ] Add `https://<vercel-domain>/api/auth/callback/google`.
- [ ] Add one admin email and one tester email to the invite allowlist.
- [ ] Confirm admin lands on the measurement dashboard and tester lands on the tier dashboard.

## 7. Provider Adapter

- [ ] Choose the first KYC provider sandbox or production-like adapter.
- [ ] Run onboarding -> provider payload -> verification -> tier unlock.
- [ ] Run enhanced upgrade.
- [ ] Confirm deny, review, outage, revoked, expired, or superseded states fail closed.

## 8. Small-Circle Pilot

- [ ] Invite 3-5 testers.
- [ ] Watch drop-off, completion rate, average flow time, decisions, and tier coverage.
- [ ] Verify `/sessions` is admin-only.
- [ ] Verify logs and database do not contain raw artifacts, files, selfies, document numbers, phone numbers, addresses, tokens, or secrets.
- [ ] Record friction points before expanding the tester circle.
