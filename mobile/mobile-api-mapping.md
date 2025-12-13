# Mobile to Backend API Mapping (Faheemly Mobile)

This document maps the mobile screens to the backend API endpoints. Use this mapping when implementing features and flows.

## Auth
- Login (mobile): POST `/api/auth/login` — body: { email, password }
- Register (mobile): POST `/api/auth/register` — body: { name, email, password, businessName, activityType }
- Demo login: POST `/api/auth/demo-login` — body: { email, password }
- Get profile: GET `/api/auth/profile` — Requires JWT
- Update profile: PUT `/api/auth/profile` — JWT required

## Chat & Widget
- Send message (Chat UI / Widget): POST `/api/chat/message` — body: { message, businessId, conversationId, sessionId }
- Get pre-chat form config: GET `/api/chat/pre-chat/:businessId` — returns fields to show
- Submit pre-chat form: POST `/api/chat/pre-chat/:businessId`
- Get widget config: GET `/api/widget/config/:businessId` — public
- Update widget config: POST `/api/widget/config` — JWT required

## Tickets / Support
- Create ticket: POST `/api/tickets` (JWT required)
- Get my tickets: GET `/api/tickets/my-tickets` (JWT required)
- Get ticket details: GET `/api/tickets/:id` (JWT required)
- Reply to ticket: POST `/api/tickets/:id/reply` (JWT required)
- Update ticket status: PUT `/api/tickets/:id/status` (JWT required)

## Business / Plan
- Get settings: GET `/api/business/settings` (JWT required)
- Update settings: PUT `/api/business/settings` (JWT required)
- Get current plan: GET `/api/business/plan` (JWT required)
- Update plan: PUT `/api/business/plan` (JWT required)

---

Notes:
- All JWT-protected endpoints require Authorization: Bearer <token>.
- For chat / widget endpoints, the backend handles rate-limiting, AI provider selection and generation, and conversation state.
- The mobile app should never send provider API keys (Gemini, Groq, etc.). All AI calls go through the backend.
