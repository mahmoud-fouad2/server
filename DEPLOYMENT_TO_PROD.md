# Production Deployment Checklist (faheemly.com)

Use this checklist when preparing to deploy the current changes to production (faheemly.com).

Pre-deploy (must have):
- [ ] Add the following secrets to repository or environment (GitHub secrets recommended):
  - `RENDER_API_KEY` (if using Render)
  - `RENDER_SERVICE_ID_SERVER` (optional)
  - `RENDER_SERVICE_ID_CLIENT` (optional)
  - `DATABASE_URL` (production database)
  - `REDIS_URL` (if used)
  - `ENCRYPTION_KEY` (used to encrypt gateway secrets — must be 32 bytes for AES-256)
  - Any 3rd-party payment provider credentials (Stripe, PayMob, etc.) as env vars

- [ ] Verify Prisma migrations (if any) are applied to production DB:
  - Run `npx prisma migrate deploy` on the prod environment or via your deploy script.
  - If you added new models (e.g., `AuditLog`), create and test the migration in staging first:
    1. On your dev machine: `npx prisma migrate dev --name add_audit_log`
    2. Review SQL in `prisma/migrations/*_add_audit_log` and commit the migration files.
    3. Apply on staging and run verification queries (e.g., `SELECT count(*) FROM "AuditLog";`).
    4. Then on production run: `npx prisma migrate deploy`.

- [ ] Verify environment configuration (NODE_ENV=production, NEXT_PUBLIC_API_URL, etc.)

Deployment using GitHub Actions (manual trigger):
1. In GitHub, go to `Actions` → `Deploy to Production` → `Run workflow`.
2. Leave `run_playwright` as `true` (optional) to run E2E after deploy.
3. The workflow triggers Render deploys for client and server (requires Render secrets).

Post-deploy checks:
- Check app at https://faheemly.com
- Run Playwright E2E manually or via the deploy workflow (the workflow will run them if selected)
- Inspect server logs for errors (Render / hosting provider dashboard)
- Verify admin features: Login as Super Admin → Payments → Gateways (edit + test key overwrite), Create Custom Payment, Invoice list.
- Verify audit logs (if available) capture gateway updates and admin actions.

Rollback plan:
- If a deploy fails or critical issue is found, use hosting provider dashboard to roll back to previous stable version.
- If data migrations are involved, follow the migration rollback procedures outlined in `MIGRATION_INSTRUCTIONS.md`.

Notes & Tips:
- Playwright E2E tests will run against `https://faheemly.com` when using the deploy workflow (it sets `PLAYWRIGHT_BASE_URL`).
- If Playwright fails to communicate with the site in the CI, run tests locally with `PLAYWRIGHT_BASE_URL=https://faheemly.com npx playwright test` for debugging.
