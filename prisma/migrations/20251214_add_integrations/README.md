Migration: add_integrations (2025-12-14)

Purpose
-------
Create database schema for Integration-related models and ensure `AuditLog` is present.

What this migration covers
- `WhatsAppIntegration` table
- `TelegramIntegration` table
- `APIIntegration` table (for Infoseed, Facebook Messenger, etc.)
- Indexes used by Prisma model definitions

Notes
-----
- This repository uses Prisma migrations. The recommended way to generate & apply this migration is via `npx prisma migrate`.
- If you prefer to generate the SQL locally and review it before applying, run `npx prisma migrate dev --name add_integrations` on a dev machine connected to a dev DB, commit the generated migration folder under `prisma/migrations/`, then apply on staging with `npx prisma migrate deploy`.

Commands (recommended flow)
--------------------------------
1. On your dev machine (connected to a dev DB):

```bash
npx prisma migrate dev --name add_integrations
# Run tests and verify locally
npx prisma generate
```

2. Commit the generated migration folder (e.g., `prisma/migrations/*_add_integrations`) and push.

3. On staging / CI: set `DATABASE_URL` to the staging DB, then run:

```bash
npx prisma migrate deploy
```

4. Verify (example queries):

```sql
SELECT count(*) FROM "WhatsAppIntegration";
SELECT count(*) FROM "TelegramIntegration";
SELECT count(*) FROM "APIIntegration";
SELECT count(*) FROM "AuditLog";
```

If you can't run `npx prisma migrate dev` locally (no local DB), you can still add a migration via your CI by creating the migration folder manually (after generating from another dev machine) and committing it.

Safety notes
------------
- Make a backup or snapshot of the staging DB before running migrations if the schema change is destructive.
- Ensure `ENCRYPTION_KEY` is set in staging/production environments prior to enabling integrations or saving API keys.
