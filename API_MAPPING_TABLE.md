# API Mapping & Gap Analysis

**Date:** 2026-01-02
**Source:** Comparison of `web/src/lib/api-client.ts` (Frontend) vs `api/src/routes/*.routes.ts` (Backend).

## Legend
- ✅ **Match**: Endpoint exists, method matches, parameters appear aligned.
- ❌ **Missing**: Endpoint defined in frontend client but **does not exist** in backend.
- ⚠️ **Mismatch**: Path or method differs between frontend and backend.
- 🔒 **Auth**: Backend requires JWT (`authenticateToken`).
- 🌍 **Public**: Backend allows public access (sometimes with rate limits or CORS checks).

---

## 1. Chat (`/api/chat`)

| Frontend Method | Frontend Path | Backend Route | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `chat.conversations` | `GET /chat/conversations` | `GET /conversations` | ✅ 🔒 | |
| `chat.messages` | `GET /chat/messages/:id` | `GET /conversations/:id/messages` | ⚠️ **Path Mismatch** | Frontend will 404. |
| `chat.send` | `POST /chat/send` | `POST /send` | ✅ 🌍 | Public endpoint. |
| `chat.reply` | `POST /chat/reply` | **MISSING** | ❌ | Backend has no explicit reply route; maybe `send` handles it? |
| `chat.handoverRequests` | `GET /chat/handover-requests` | `GET /handover-requests` | ✅ 🔒 | |
| `chat.acceptHandover` | `POST /chat/handover/:id/accept` | **MISSING** | ❌ | |
| `chat.markRead` | `POST /chat/:id/mark-read` | `POST /:id/mark-read` | ✅ 🔒 | |
| `chat.demoChat` | `POST /chat/demo` | `POST /demo` | ✅ 🌍 | |

## 2. Knowledge Base (`/api/knowledge`)

| Frontend Method | Frontend Path | Backend Route | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `knowledge.list` | `GET /knowledge` | `GET /` | ✅ 🔒 | |
| `knowledge.create` | `POST /knowledge` | `POST /` | ✅ 🔒 | |
| `knowledge.delete` | `DELETE /knowledge/:id` | `DELETE /:id` | ✅ 🔒 | |
| `knowledge.update` | `PUT /knowledge/:id` | **MISSING** | ❌ | Editing KB entries is impossible. |
| `knowledge.reindex` | `POST /knowledge/reindex` | `POST /reindex` | ✅ 🔒 | |
| `knowledge.addText` | `POST /knowledge/text` | `POST /text` | ✅ 🔒 | |
| `knowledge.addUrl` | `POST /knowledge/url` | `POST /url` | ✅ 🔒 | |
| `knowledge.upload` | `POST /knowledge/upload` | `POST /upload` | ✅ 🔒 | |

## 3. CRM (`/api/crm`)

| Frontend Method | Frontend Path | Backend Route | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `crm.getLeads` | `GET /crm/leads` | `GET /leads` | ✅ 🔒 | |
| `crm.createLead` | `POST /crm/leads` | `POST /leads` | ✅ 🔒 | |
| `crm.updateLead` | `PATCH /crm/leads/:id` | **MISSING** | ❌ | Cannot edit leads. |
| `crm.deleteLead` | `DELETE /crm/leads/:id` | **MISSING** | ❌ | Cannot delete leads. |
| `crm.exportLeads` | `GET /crm/export` | `GET /export` | ✅ 🔒 | |
| `crm.toggleCrm` | `POST /crm/toggle` | `POST /toggle` | ✅ 🔒 | |
| `crm.getCrmStatus` | `GET /crm/status` | `GET /status` | ✅ 🔒 | |

## 4. Tickets (`/api/tickets`)

| Frontend Method | Frontend Path | Backend Route | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `ticket.list` | `GET /tickets` | `GET /` | ✅ 🔒 | |
| `ticket.create` | `POST /tickets` | `POST /` | ✅ 🔒 | |
| `ticket.get` | `GET /tickets/:id` | `GET /:id` | ✅ 🔒 | |
| `ticket.reply` | `POST /tickets/:id/messages` | `POST /:id/messages` | ✅ 🔒 | |
| `ticket.updateStatus` | `PATCH /tickets/:id/status` | `PATCH /:id/status` | ✅ 🔒 | |
| `ticket.markRead` | `POST /tickets/:id/mark-read` | **MISSING** | ❌ | |

## 5. Payments (`/api/payments`)

| Frontend Method | Frontend Path | Backend Route | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `payment.list` | `GET /payments` | `GET /` | ✅ 🔒 | |
| `payment.createIntent` | `POST /payments/intent` | `POST /intent` | ✅ 🔒 | |
| `payment.getGateways` | `GET /payments/gateways` | **MISSING** | ❌ | |
| `payment.createPayment` | `POST /payments/create` | **MISSING** | ❌ | |
| `payment.getPayment` | `GET /payments/:id` | **MISSING** | ❌ | |

## 6. Admin (`/api/admin`)

**Critical Gap:** The frontend Admin Dashboard is wired to a massive API surface that largely does not exist.

| Frontend Method | Frontend Path | Backend Route | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `admin.getStats` | `GET /admin/stats` | `GET /stats` | ✅ 🔒 | |
| `admin.getUsers` | `GET /admin/users` | `GET /users` | ✅ 🔒 | |
| `admin.getBusinesses` | `GET /admin/businesses` | `GET /businesses` | ✅ 🔒 | |
| `admin.getBusiness` | `GET /admin/businesses/:id` | **MISSING** | ❌ | |
| `admin.updateBusiness` | `PUT /admin/businesses/:id` | **MISSING** | ❌ | Only `verify`, `suspend`, `activate`, `quota` exist. |
| `admin.deleteBusiness` | `DELETE /admin/businesses/:id` | `DELETE /businesses/:id` | ✅ 🔒 | |
| `admin.getAuditLogs` | `GET /admin/audit-logs` | `GET /audit-logs` | ✅ 🔒 | |
| `admin.getIntegrations` | `GET /admin/integrations` | **MISSING** | ❌ | |
| `admin.getMedia` | `GET /admin/media` | **MISSING** | ❌ | |
| `admin.getPayments` | `GET /admin/payments` | **MISSING** | ❌ | |
| `admin.getSEO` | `GET /admin/seo` | **MISSING** | ❌ | |
| `admin.getSystemSettings`| `GET /admin/system/settings` | **MISSING** | ❌ | |
| `admin.getAIModels` | `GET /admin/ai-models` | **MISSING** | ❌ | |
| `admin.getLogs` | `GET /admin/logs` | **MISSING** | ❌ | |
| `admin.getAllTickets` | `GET /tickets/all` | **MISSING** | ❌ | |
| `admin.getMonitoring` | `GET /admin/monitoring` | **MISSING** | ❌ | |
| `admin.getInvoices` | `GET /admin/payments/invoices`| **MISSING** | ❌ | |

## 7. Other Modules

| Module | Status | Notes |
| :--- | :--- | :--- |
| **Auth** | ✅ | Login, Register, Me, Profile, Password ops all appear matched. |
| **Business** | ✅ | Settings, Stats, Integrations, Conversations matched. |
| **Widget** | ✅ | Config, Update Config, Loader matched. |
| **Team** | ✅ | List, Add, Delete matched. |
| **Integration** | ✅ | Telegram, WhatsApp, Remove matched. |
| **Visitor** | ✅ | Session, Track, Analytics matched. |
| **AI** | ✅ | Models list/create matched. |
| **API Keys** | ❓ | `api-key.routes.ts` exists but not fully audited against client. |
| **Notifications** | ❓ | `notification.routes.ts` exists but not fully audited against client. |

## Summary of Critical Actions

1.  **Fix Chat Messages Path**: Update frontend `api-client.ts` to use `/chat/conversations/${id}/messages`.
2.  **Implement Missing CRUD**: Add `update` and `delete` for CRM Leads and Knowledge Base entries in backend.
3.  **Stub Admin Routes**: The Admin UI is likely broken. Either hide the UI sections or implement stub endpoints in `admin.routes.ts`.
4.  **Fix Ticket Mark Read**: Add the route to `ticket.routes.ts`.
