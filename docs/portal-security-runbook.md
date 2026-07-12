# Portal Security Runbook

## Required Production Configuration

- `STAFF_JWT_SECRET`: staff-only signing key. Do not reuse a customer or cron key.
- `CLIENT_JWT_SECRET`: customer-only signing key. Do not reuse the staff key.
- `AUTH_THROTTLE_SALT`: independent secret used to pseudonymize login throttle keys.
- `CRON_SECRET`: dedicated bearer secret for scheduled publishing.
- `NETLIFY_DATABASE_URL`: runtime database URL used by the portal and migration checks.
- R2 credentials: required as a complete set before document download or upload is enabled.

Use independently generated high-entropy values. Never place production values in the repository, logs, screenshots, or support notes.

## Rotation Requirement

Assume the former shared staff token and any token stored by the retired admin interface may have been exposed. Before production rollout:

1. Rotate the former shared JWT secret if it still exists.
2. Create independent staff and customer signing keys.
3. Rotate the cron secret.
4. Set a separate throttle salt.
5. Revoke existing staff and customer sessions by incrementing their session versions where required.
6. Verify that no production environment still defines or consumes the former shared `JWT_SECRET`.

Signing-key rotation invalidates existing tokens and requires users to sign in again.

## Migration Gate

Apply `014-shipment-voids.sql` and `015-portal-production-readiness.sql` in a non-production database first. Run the migration checker and targeted security tests before applying the same checksummed files in production. The migrations are additive and preserve shipment, customer, document, tracking, invoice, and audit history.

Do not deploy application code that reads the new columns before both migrations are verified in that environment.

## Production Verification Gate

- Confirm `/en/admin` and retired legacy staff APIs are blocked.
- Confirm staff and customer tokens cannot cross audiences.
- Confirm missing or invalid cron credentials return `401`.
- Confirm public tracking contains no customer identity or internal void fields.
- Confirm customer and staff session revocation takes effect immediately.
- Confirm document URLs are short-lived and no storage object key is returned when signing is unavailable.
- Confirm security headers on the deployed host.

Production deployment requires an explicit approval after preview testing.
