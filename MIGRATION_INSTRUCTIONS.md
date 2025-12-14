# Migration Instructions & Checklist

Follow this checklist when applying schema migrations that affect production or staging.

1) Generate the migration locally (dev machine)

```bash
# from project root
cd server
npx prisma migrate dev --name add_integrations
npx prisma generate
```

2) Commit and open a PR with the generated migration folder under `prisma/migrations/`.

3) On staging environment:
 - Ensure `DATABASE_URL` points to the staging DB
 - Ensure `ENCRYPTION_KEY` is set in the environment
 - Use the manual GitHub workflow `Run Prisma Migrations (manual)` (or run `npx prisma migrate deploy` on the staging server)

4) Verification queries (run on staging DB)

```sql
SELECT count(*) FROM "WhatsAppIntegration";
SELECT count(*) FROM "TelegramIntegration";
SELECT count(*) FROM "APIIntegration";
SELECT count(*) FROM "AuditLog";
```

5) Run smoke tests (unit + e2e) against staging, and review logs for errors.

6) When green, use the same workflow or command on production with `DATABASE_URL` pointing at production and ensure `ENCRYPTION_KEY` is set.
