# Playwright E2E

Quick notes for running the Playwright tests locally.

- Install deps in client directory:
  - npm ci
  - npx playwright install --with-deps

- Run tests:
  - npm run test:e2e

Local server note:
- If Playwright fails to start the site automatically (sometimes local environments restrict background servers), you can serve the exported output manually in one terminal:

```pwsh
cd client
# Build/export the site if not already exported
npm run export
# Serve the exported site
npm run serve:out
```

Then run the tests in another terminal:

```pwsh
npx playwright test
```
 
Running tests against production
--------------------------------

If you want to run the E2E tests against a live production site (for example https://faheemly.com) and avoid running any local server, set the following environment variables and run Playwright:

- `PLAYWRIGHT_BASE_URL` — the base URL of the site, e.g. `https://faheemly.com` (defaults to `http://localhost:3000`)
- `PLAYWRIGHT_LIVE=1` — instructs tests *not* to stub API endpoints so they exercise the real backend
- `PLAYWRIGHT_ADMIN_TOKEN` — optional: a valid admin JWT token to be injected into `localStorage.token` before the page loads so the admin UI is authenticated
- `PLAYWRIGHT_ADMIN_USER` — optional: a JSON string of the user object to be stored in `localStorage.user` (e.g., '{"id":"...","role":"ADMIN"}')

Example (Linux/macOS):

```bash
PLAYWRIGHT_BASE_URL=https://faheemly.com PLAYWRIGHT_LIVE=1 \
  PLAYWRIGHT_ADMIN_TOKEN="$ADMIN_TOKEN" \
  PLAYWRIGHT_ADMIN_USER='{"id":"u1","role":"ADMIN"}' \
  npx playwright test --reporter=html
```

On Windows (PowerShell):

```powershell

- The `playwright.config.ts` webServer will build and start the app; on CI the server will be launched automatically by Playwright.

- Tests stub API endpoints so they can run without a real backend for these happy-path flows.
npx playwright test --reporter=html
```

Notes:
- Be careful when pointing tests at a live production site — tests may create or modify production data. Prefer running against a production-like staging environment with test credentials when possible.
- The `PLAYWRIGHT_ADMIN_TOKEN` should be kept secret (store it in CI secrets rather than inline).
