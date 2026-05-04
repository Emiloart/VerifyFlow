# Privacy Rules

## Purpose

VerifyFlow measures KYC flows without turning the product into a broad identity data store.

## Rules

- Collect only normalized onboarding claims needed to run the configured provider flow.
- Do not collect raw document images, document numbers, liveness media, sanctions evidence, or free-form KYC evidence.
- Do not store opaque provider artifacts long-term.
- Do not log raw claims, artifacts, tokens, client secrets, or request bodies.
- Store verification decisions, reason codes, provider run IDs, timestamps, and artifact digests only when needed for product state or audit.
- Keep funnel events bounded to step, outcome, timestamp, and pseudonymous user/session IDs.
- Avoid third-party replay or broad analytics in v1.

## Retention posture

Until a dedicated retention policy is approved, keep personal data to the minimum required for local testing and pilot review.
