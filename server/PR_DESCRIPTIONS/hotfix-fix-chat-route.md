Title: fix(chat): ensure admin listing routes precede conversation param route

Summary
-------
Fixes an issue where admin listing routes (`/conversations`, `/handover-requests`) were incorrectly matched by the generic `/:conversationId` route due to route ordering in Express. This caused repeated 404s on the dashboard and noise in production logs.

What I changed
--------------
- Moved the single-conversation GET route to be defined after the admin listing routes in `server/src/routes/chat.routes.js`.
- Added regression test `server/tests/unit/chat.routes.order.test.js` to ensure `/conversations` and `/handover-requests` are routed correctly.

Testing plan
------------
1. Merge to staging
2. Run smoke tests:
   - GET /api/chat/conversations with a valid Authorization token → 200
   - GET /api/chat/handover-requests with a valid Authorization token → 200
   - Dashboard loads without repeated 404s for those endpoints

Notes
-----
- Local Jest runs are currently blocked in the environment by ESM/Prisma test config; I will follow up with a separate PR that fixes test transform and Prisma test DB configuration so CI/local runs are stable.
- If you'd like me to merge directly to main and trigger the hotfix deploy, confirm and I'll perform the merge and run the staging smoke tests.

Signed-off-by: GitHub Copilot
