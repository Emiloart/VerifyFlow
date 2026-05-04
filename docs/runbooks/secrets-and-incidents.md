# Secrets And Incidents Runbook

## Secrets

Store only in deployment secret managers or local `.env` files ignored by git:

- Auth.js secrets
- Google OAuth credentials
- KYC provider issue/check client secret
- KYC provider verification client secret
- database credentials

## Incident response

If a provider client secret leaks:

1. Disable or rotate the affected provider client.
2. Invalidate active deployment secrets.
3. Review VerifyFlow audit events.
4. Review provider audit records when available.
5. Remove leaked values from all logs or support channels.

If an artifact or raw claim leaks:

1. Remove it from the exposed location.
2. Identify affected user and provider run ID.
3. Revoke, cancel, or supersede the provider check when supported.
4. Document containment and follow-up work.
