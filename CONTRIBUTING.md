# Contributing

VerifyFlow is a trust-sensitive measurement product.
Optimize for security, privacy, correctness, and portability before speed.

## Required process

- Keep provider integration through explicit adapters only.
- Update docs with behavior changes.
- Add or update tests for auth, tier, provider integration, persistence, and telemetry changes.
- Do not add production dependencies without a documented rationale.
- Do not commit secrets, bearer tokens, raw artifacts, raw PII, or credential fixtures.

## Validation

Run:

```bash
npm run validate
```

Report validation truthfully in PRs.
