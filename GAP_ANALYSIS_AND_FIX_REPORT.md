# Gap Analysis & Fix Report - Faheemly Dashboard

## 1. Database Schema Mismatches (Fixed)
The following fields were referenced in the code but missing in the database. They have been restored in `schema.prisma` and will be applied via migration.
- **AuditLog.businessId**: Essential for multi-tenant audit logging.
- **AgentHandoff.assignedTo**: Required for assigning chats to specific agents.
- **VisitorSession.browser/os**: Added for better analytics.
- **PageVisit Model**: Added to track "Top Pages" and user journey.
- **Business.systemPrompt**: Added for "Bot Experience" customization.

## 2. Missing API Endpoints (Fixed)
The following endpoints were called by the Frontend but missing in the Backend.
- **POST /api/knowledge/reindex**: Implemented. Triggers a background job to regenerate embeddings for all knowledge base entries.
- **POST /api/business/cache/invalidate**: Already existed, verified.
- **GET /api/analytics/alerts**: Added placeholder.
- **GET /api/rating/stats**: Added placeholder.
- **GET /api/visitor/active-sessions**: Added placeholder.
- **GET /api/visitor/analytics**: Added placeholder.

## 3. Dashboard Data Gaps (Fixed)
The "Quick Summary" dashboard relied on `businessApi.getStats`, which only returned basic counts.
- **Action**: Updated `BusinessService.getStats` to include `visitorStats` (Total Sessions, Active Now, Device Stats, Browser Stats, Top Pages).
- **Action**: Updated `VisitorService` to aggregate this data from `VisitorSession` and `PageVisit` tables.

## 4. Frontend Integration Status
- **Visitor Tracking**: The frontend currently only sends `sessionId`. It needs to be updated to send `url` and `title` to `/api/visitor/track` to populate the "Top Pages" chart.
- **Realtime**: The "Active Now" stat is now calculated based on sessions active in the last 15 minutes.

## 5. Next Steps (User Action Required)
1. **Run Migration**: Execute `npx prisma migrate dev --name fix_dashboard_schema` to apply the schema changes.
2. **Update Frontend Tracking**: Modify `WidgetLoader.jsx` or the tracking hook to send `{ url: window.location.href, title: document.title }` to `/api/visitor/track`.
3. **Verify**: Check the Dashboard "Overview" tab to see the new charts populating.

