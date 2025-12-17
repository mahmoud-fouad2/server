# Architecture & Core Guidelines

Purpose: provide a concise overview of the core architecture and rules to avoid accidental breakage.

- Backend: Node.js + Express, Prisma (Postgres) — server code lives in `/server/src`.
- Frontend: Next.js in `/client`.
- Database migrations: use `prisma migrate` and include migration SQL in the PR.
- Tests: unit and integration tests run with Jest. CI runs lint + tests on every PR.

Guidelines:
- Always add or update tests for new features or bug fixes.
- Avoid changing core interfaces without a design note and reviewer approval.
- Changes to database schema must include migration files and a migration plan.
- Keep logic in services/controllers and avoid duplicating routes; use compatibility shims only when necessary.
