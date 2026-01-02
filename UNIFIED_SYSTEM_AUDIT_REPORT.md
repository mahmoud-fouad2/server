# Unified System Audit Report (Monorepo)

Date: 2026-01-02

Scope: `api/` (Express + Prisma), `web/` (Next.js), `widget/` (Vite + Preact), `shared/` (DTOs), `tests/` (Playwright), build/deploy (`render.yaml`), scripts, and operational concerns.

Constraints respected: **audit/report only** (no refactors applied in this report).

## Methodology (what I actually checked)

- Read entrypoints and route mounts: `api/src/index.ts`, core route files under `api/src/routes/*`.
- Read the canonical frontend API client: `web/src/lib/api-client.ts`.
- Ran repo-local static analysis:
  - Backend: `api/npm run lint` (result: **21 errors, 66 warnings**)
  - Backend: `api/npx ts-prune` (unused exports scan)
  - Frontend: `web/npm run lint` (**no findings / passes**)

## Detailed Sub-Reports

- [API_MAPPING_TABLE.md](API_MAPPING_TABLE.md): Detailed endpoint-by-endpoint comparison of Frontend vs Backend.
- [DEAD_CODE_REPORT.md](DEAD_CODE_REPORT.md): List of unused components, duplicated UI libraries, and unused backend exports.

## Repo map (what each top-level folder is for)

- `api/`: Express TS API server + Prisma DB layer + BullMQ worker + widget static hosting.
- `web/`: Next.js dashboard + marketing pages + widget loader integration.
- `widget/`: Embeddable widget (Vite build output copied into `api/public/`).
- `shared/`: Shared DTOs/validation schemas consumed by `api` and `web`.
- `tests/`: Playwright E2E tests.
- `uploads/`: runtime upload directory served by API (`/uploads/*`).
- Root `*.md` reports: previously generated audits/status docs.

## Build & deploy

### Build orchestration
- Root build: `npm run build` runs shared → widget → api → web (see `package.json`).
- API build: `tsc` + `postbuild` copies widget output (`api/scripts/copy-widget.js`).
- Web build: `next build`.

### Render deployment
- `render.yaml` defines:
  - `fahimo-api` (web service)
  - `fahimo-worker` (worker service)
  - `fahimo-web` (web service)

**High-impact config bug**:
- `render.yaml` sets `CORS_ORIGINS: "*"`, but the API CORS logic treats `CORS_ORIGINS` as a comma-separated allowlist of exact origin strings.
  - In production, an origin like `https://faheemly.com` will **not** equal `"*"`, and requests will be rejected.
  - Recommended: set `CORS_ORIGINS` to an explicit list like `https://faheemly.com,https://www.faheemly.com`.

## Architecture overview

### Runtime request paths
- API base: `https://<api-host>/api/...`
- Widget script: `https://<api-host>/fahimo-widget.js` (served as static JS)
- Uploads: `https://<api-host>/uploads/<filename>`

### Entry points
- API: `api/src/index.ts`
- Worker: `api/src/worker.ts`
- Web: Next.js app under `web/src/app/*`
- Widget: `widget/src/*` built via Vite

## Backend API surface (what actually exists)

All routes are mounted in `api/src/index.ts` under `/api/*`.

### Chat (`/api/chat`)
From `api/src/routes/chat.routes.ts`:
- `POST /api/chat/send` (public; **NOT** JWT-authenticated)
- `POST /api/chat/demo` (public)
- `POST /api/chat/rate` (public)
- `GET /api/chat/conversations` (JWT)
- `GET /api/chat/conversations/:conversationId/messages` (JWT)
- `POST /api/chat/conversations/:conversationId/handoff` (JWT)
- `GET /api/chat/conversations/:conversationId/analytics` (JWT)
- `GET /api/chat/handover-requests` (JWT)
- `POST /api/chat/:conversationId/mark-read` (JWT)

### Knowledge (`/api/knowledge`)
From `api/src/routes/knowledge.routes.ts` (JWT required for all):
- `GET /api/knowledge/`
- `POST /api/knowledge/`
- `POST /api/knowledge/text`
- `POST /api/knowledge/url`
- `POST /api/knowledge/upload`
- `POST /api/knowledge/reindex`
- `DELETE /api/knowledge/:id`

Notably missing:
- `PUT /api/knowledge/:id` (frontend expects it; backend does not expose it)

### Tickets (`/api/tickets`)
From `api/src/routes/ticket.routes.ts` (JWT required):
- `POST /api/tickets/`
- `GET /api/tickets/`
- `GET /api/tickets/:id`
- `POST /api/tickets/:id/messages`
- `PATCH /api/tickets/:id/status`

Notably missing:
- `POST /api/tickets/:id/mark-read` (frontend expects it; backend does not expose it)
- `GET /api/tickets/all` (frontend admin expects it; backend does not expose it)

### Payments (`/api/payments`)
From `api/src/routes/payment.routes.ts` (JWT required):
- `GET /api/payments/`
- `POST /api/payments/intent`

Notably missing (frontend expects these):
- `GET /api/payments/gateways`
- `POST /api/payments/create`
- `GET /api/payments/:id`

### Admin (`/api/admin`)
From `api/src/routes/admin.routes.ts` (JWT + role `SUPERADMIN` required):
- `GET /api/admin/stats`
- `GET /api/admin/stats/financial`
- `GET /api/admin/system/health`
- `GET /api/admin/users`
- `GET /api/admin/businesses`
- `POST /api/admin/businesses/:id/verify`
- `POST /api/admin/businesses/:id/suspend`
- `POST /api/admin/businesses/:id/activate`
- `DELETE /api/admin/businesses/:id`
- `POST /api/admin/businesses/:id/quota`
- `GET /api/admin/audit-logs`

Notably missing: most of the admin endpoints referenced in the frontend (see mismatches section).

## Frontend API contract (what the UI calls)

The canonical client is `web/src/lib/api-client.ts`.

Key characteristics:
- Always calls `${API_BASE}/api/<endpoint>` (it normalizes away a leading `/api`).
- Adds `Authorization: Bearer <token>` from `localStorage`.
- Adds `x-business-id` derived from `localStorage.user` (or `NEXT_PUBLIC_WIDGET_BUSINESS_ID`).
- Auto-logout redirect on 401 and some 403 cases.

## Cross-layer mismatches (frontend ↔ backend)

These are **hard breakages**: UI calls routes that are not implemented or differ in path/method.

### Confirmed mismatches
- Chat messages:
  - Frontend: `GET /api/chat/messages/:conversationId`
  - Backend:  `GET /api/chat/conversations/:conversationId/messages`
  - Impact: conversation view can 404.

- Knowledge update:
  - Frontend: `PUT /api/knowledge/:id`
  - Backend:  (missing)
  - Impact: “edit KB entry” UX cannot work.

- Ticket mark-read:
  - Frontend: `POST /api/tickets/:id/mark-read`
  - Backend:  (missing)
  - Impact: notification/read-state UX cannot work.

- Payments feature surface:
  - Frontend expects `gateways`, `create`, `GET by id`
  - Backend only exposes `list` and `intent`
  - Impact: payment pages will partially or fully break.

- Admin feature surface:
  - Frontend references many endpoints like:
    - `GET /api/admin/businesses/:id`
    - `PUT /api/admin/businesses/:id`
    - `GET /api/admin/integrations`, `/media`, `/payments`, `/seo`, `/logs`, `/monitoring`, etc.
  - Backend only exposes a small subset (`stats`, `users`, `businesses` list and action posts, audit-logs).
  - Impact: large sections of the admin UI are effectively wired to non-existent API.

## Auth & tenancy model review

### What exists
- Backend JWT middleware: `api/src/middleware/auth.ts`
- Multi-tenant context: `x-business-id` header overrides business context.

### Key risks / inconsistencies
- Role naming confusion:
  - `authorizeRole(['SUPERADMIN'])` is used for admin routes.
  - In `authenticateToken`, the special-case check uses `user.role !== 'ADMIN'` as the bypass for business mismatch.
  - Impact: incorrect access behavior for privileged users.

- Status codes:
  - JWT failures normalized to 401 (good).
  - “User not found” returns 403; this is arguably more correct as 401 in token-auth contexts.

## Knowledge Base / crawling / embeddings pipeline

### Current functional model
- Embeddings are stored on `KnowledgeChunk.embedding` (not a separate table).
- KB ingestion creates `KnowledgeChunk` rows and indexes those.
- Queue/worker is optional: API can fallback to inline processing if Redis/queues are unavailable.

### Security concern: crawler SSRF
- `api/src/services/web-crawler.service.ts` uses `axios.get(url)` on user-provided URLs.
- There is no explicit blocklist for:
  - localhost
  - private IP ranges
  - link-local metadata endpoints
- Impact: SSRF possible (e.g., crawling internal services).
- Recommended: restrict to `http/https`, block private/loopback ranges, and enforce a hostname allowlist per business if possible.

## Widget flow (embed)

- Widget JS is served by API as `/fahimo-widget.js` with `Access-Control-Allow-Origin: *`.
- Widget config is read via `/api/widget/config/:businessId` (public).

Risks:
- Public config endpoints must be careful not to leak sensitive business configuration.

## Uploads

- Endpoint: `POST /api/uploads` (JWT required)
- Storage: disk under `uploads/`
- Served publicly: `/uploads/*`

Notes:
- Filetype allowlist is extension-based (`.png`, `.jpg`, `.jpeg`, `.gif`, `.txt`, `.pdf`, `.doc`, `.docx`).
- Consider adding content-sniffing and/or forcing `Content-Disposition: attachment` for risky types.

## Lint findings (dead code / hygiene)

### Backend eslint summary (`api/npm run lint`)
- 21 errors, 66 warnings.

Main themes:
- Many `@ts-ignore` comments (eslint requires `@ts-expect-error`).
- Many unused imports/vars (common pattern: `catch (error)` not used; unused `Request` import).
- One unsafe type usage: `Function` type flagged in `api/src/middleware/errorHandler.ts` (`no-unsafe-function-type`).

### Backend unused exports scan (`api/npx ts-prune`)
`ts-prune` reported many exports that appear only “used in module” (exported but not imported elsewhere), e.g.:
- `api/src/middleware/csrf.ts`: `generateCSRFToken`, `validateCSRFToken`, default
- `api/src/middleware/errorHandler.ts`: `asyncHandler`
- `api/src/middleware/rateLimiter.ts`: `authLimiter`, `chatLimiter`, `widgetLimiter`
- `api/src/services/*`: several defaults

Interpretation: these may be **dead exports** or simply **not wired** in `api/src/index.ts`.

### Frontend lint
- `web/npm run lint` shows no issues.

## Top 20 issues (prioritized)

Severity legend: P0 (production-breaking / security), P1 (major functional gap), P2 (quality/maintainability).

1) P0 — **CORS_ORIGINS is set to `"*"` but code does not treat it as wildcard** → production requests can be blocked.
2) P0 — **Crawler SSRF risk** in `web-crawler.service.ts` (unrestricted URL fetching).
3) P0 — **Frontend calls non-existent chat messages endpoint** (`/chat/messages/:id`).
4) P1 — **Knowledge update endpoint missing** (`PUT /knowledge/:id`).
5) P1 — **Ticket mark-read missing** (`POST /tickets/:id/mark-read`).
6) P1 — **Payment API surface mismatch** (frontend expects gateways/create/get; backend only list/intent).
7) P1 — **Admin API surface mismatch** (frontend expects far more than backend exposes).
8) P1 — **Role name mismatch (`ADMIN` vs `SUPERADMIN`)** can cause tenant access bugs.
9) P1 — **Public chat endpoints** (`/chat/send`) must be strictly validated/rate-limited to prevent abuse and cost spikes.
10) P2 — Backend lint errors/warnings hide real issues and slow safe refactors.
11) P2 — `@ts-ignore` usage prevents type safety; replace with explicit typing or `@ts-expect-error` only when intentional.
12) P2 — Some exports not wired (ts-prune) indicates drift between planned and real features.
13) P2 — Upload serving is public; ensure content types and download headers are safe.
14) P2 — Sanitization middleware is global; risk of over-sanitizing legitimate payloads or missing nested fields.
15) P2 — Multiple Redis clients (`redis` + `ioredis`) increases complexity.
16) P2 — Sentry request/tracing handlers are commented out; Sentry init exists but may not capture request context.
17) P2 — `/api/business` mounted twice (business + avatarSettings) increases route ambiguity risk.
18) P2 — Some endpoints use businessId derived from client localStorage; if user has multiple businesses, selection correctness matters.
19) P2 — Worker service exists but system also has inline fallbacks; ensure operational expectations are clear.
20) P2 — Docs/reports are plentiful but not consolidated; risk of conflicting guidance.

## Recommended next steps (no refactor yet, just a fix plan)

1) Fix Render config: set `CORS_ORIGINS` to explicit origins, not `"*"`.
2) Decide the source of truth for API contracts:
   - either update frontend `api-client.ts` to match backend routes
   - or implement the missing backend routes that the UI expects.
3) Add SSRF protections to crawler URL ingestion.
4) Normalize roles (`SUPERADMIN` vs `ADMIN`) and tenant override rules.
5) Address backend lint errors first (especially `@ts-ignore` and unsafe `Function` type), so future changes are safer.

---

If you want, I can follow up with a **machine-generated API mapping table** (every frontend endpoint vs backend existence) and a **dead-code list** expanded from `ts-prune` + TypeScript `noUnusedLocals` across packages.
