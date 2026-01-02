# Full System Audit Report
**Date:** January 2, 2026
**Scope:** Backend (API), Frontend (Web), Project Logic, Dead Code

## 1. Executive Summary
The project is a sophisticated SaaS Chatbot platform ("Faheemly") focused on Arabic dialects. It uses a modern stack (Next.js, Express, Prisma, PostgreSQL/pgvector, Redis, Socket.IO). The codebase is generally well-structured but contains significant "dead code" from features that were either abandoned or not yet fully implemented in the frontend.

## 2. Project Logic & Architecture

### Core Logic
*   **Multi-Tenancy**: The system is built around `Business` entities. Users belong to businesses, and all resources (Chats, Knowledge Base, Tickets) are scoped to a `businessId`.
*   **Hybrid Chat System**:
    *   **Real-time**: Uses `Socket.IO` (with Redis adapter for scaling) for instant messaging.
    *   **REST Fallback**: The frontend `api-client.ts` also supports polling/REST methods (`/chat/messages`), ensuring reliability.
*   **AI & RAG**:
    *   **Knowledge Base**: Uses `pgvector` (via Prisma) to store embeddings of business documents.
    *   **Inference**: `AIService` handles intent detection and response generation, likely querying the vector store for context.
*   **Authentication**: JWT-based stateless authentication.

### Frontend Architecture
*   **Framework**: Next.js 15 (App Router).
*   **State Management**: React Query (`useQueries.ts`) for server state, Context API (`AppContext`) for global UI state.
*   **Styling**: Tailwind CSS with a custom design system (RTL-first).
*   **API Layer**: Centralized `api-client.ts` with robust error handling, retry logic, and base URL resolution.

## 3. Dead Code Analysis

### Backend (API)
The following files/features appear to be unused or unreachable:

| File/Feature | Status | Recommendation |
| :--- | :--- | :--- |
| `src/services/telegram.service.ts` | **Dead** | Exported but never imported. Delete if Telegram integration is not active. |
| `src/services/whatsapp.service.ts` | **Dead** | Exported but never imported. Delete if WhatsApp integration is not active. |
| `src/routes/continuous-improvement.*` | **Zombie** | Routes exist and are defined in client, but **NO UI** uses them. |
| `src/scripts/seed-faheemly-crawl.ts` | **One-off** | Script for initial seeding. Can be moved to `scripts/archive` or deleted. |

### Frontend (Web)
| File/Feature | Status | Recommendation |
| :--- | :--- | :--- |
| `src/lib/api.ts` | **Redundant** | Just re-exports `api-client.ts`. Use `api-client.ts` directly to reduce confusion. |
| `src/app/test-widget` | **Dev Tool** | Exposed route `/test-widget`. Should be disabled or protected in production. |
| `src/components/SalesBot.jsx` | **Active** | Verified as USED in `ClientLayout.jsx`. (False positive in previous checks). |

## 4. Logic & Consistency Audit

### API vs Client Mismatch
*   **Continuous Improvement**: The backend has full MVC support (Route -> Controller -> Service) for "Gaps" and "Suggestions", and the frontend `api-client.ts` defines `improvementApi`. However, **no UI component calls this API**. It is a "ghost feature".
*   **Custom AI Models**: Fully implemented in Backend and Frontend (`AdminDashboard` uses it). **Status: Healthy**.

### Security & Best Practices
*   **Secrets**: `api-client.ts` has a fallback `PRODUCTION_DEFAULT_API_BASE`. Ensure this matches your actual production URL.
*   **Localhost Leaks**: The client has logic to detect `localhost` usage in production and force a redirect/rewrite. This is good defensive coding.

## 5. Recommendations

1.  **Cleanup**:
    *   Delete `telegram.service.ts` and `whatsapp.service.ts` if they are truly unused.
    *   Decide on "Continuous Improvement": either build the UI for it or remove the backend code to reduce noise.
    *   Remove `web/src/lib/api.ts` and update imports to point to `api-client.ts`.

2.  **Security**:
    *   Add middleware to block `/test-widget` in production environments.

3.  **Optimization**:
    *   The `SocketService` initializes a Redis connection. Ensure `REDIS_URL` is set in production, otherwise, it falls back to memory (which doesn't scale across multiple instances).

