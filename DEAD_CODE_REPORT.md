# Dead Code & Duplication Report

**Date:** 2026-01-02
**Scope:** Frontend (`web`) and Backend (`api`).

## 1. Frontend: Unused & Commented-Out Components

### `DemoChat` & `DemoChatWindow`
- **Files:** `web/src/components/DemoChat.jsx`, `web/src/components/DemoChatWindow.jsx`
- **Status:** **Dead / Commented Out**
- **Evidence:**
  - Imported in `LandingPage.jsx` but **not used** in JSX.
  - Imported in `LandingSections.jsx` but explicitly commented out: `{/* DemoChat removed to show real widget only */}`.
- **Recommendation:** Delete these files.

### `SalesBot`
- **File:** `web/src/components/SalesBot.jsx`
- **Status:** **Active (Global)**
- **Notes:** Used in `ClientLayout.jsx`. However, it is also imported in `LandingSections.jsx` where it is commented out.
- **Recommendation:** Remove the unused import/comment in `LandingSections.jsx` to clean up.

## 2. Frontend: UI Component Duplication

**Critical Finding:** Two competing UI libraries exist side-by-side.

| Legacy Component | Modern Component (Shadcn/UI) | Usage |
| :--- | :--- | :--- |
| `Components.jsx` (`Button`) | `ui/button.tsx` | **Legacy:** Landing, Login, Navigation.<br>**Modern:** Wizard, Dashboard. |
| `Components.jsx` (`Input`) | `ui/input.jsx` | **Legacy:** Login.<br>**Modern:** Wizard. |
| `Components.jsx` (`Badge`) | `ui/badge.jsx` | `badge.jsx` actually *re-exports* the legacy component! |
| `Components.jsx` (`Card`) | `ui/card.jsx` | Mixed usage. |

- **Impact:** Inconsistent styling, double bundle size for UI primitives, maintenance confusion.
- **Recommendation:** Refactor all `Components.jsx` usages to use the individual `ui/*.tsx` components, then delete `Components.jsx`.

## 3. Backend: Unused Exports (ts-prune)

The following exports are defined but never imported in the backend codebase. They are candidates for deletion.

### Middleware
- `api/src/middleware/csrf.ts`: `generateCSRFToken`, `validateCSRFToken` (CSRF appears unused or handled elsewhere).
- `api/src/middleware/rateLimiter.ts`: `authLimiter`, `chatLimiter`, `widgetLimiter` (Only `globalLimiter` and `apiLimiter` seem wired in `index.ts`).

### Services
- `api/src/services/dialect.service.ts`: `default` export unused? (Check if named exports are used).
- `api/src/services/telegram.service.ts`: `default` export unused.
- `api/src/services/whatsapp.service.ts`: `default` export unused.

### DTOs & Schemas
- `api/src/dtos/widget.dto.ts`: `WidgetConfig`, `DEFAULT_WIDGET_CONFIG`.
- `api/src/shared_local/index.ts`: Multiple schemas (`PreChatFieldSchema`, `WidgetConfig`) appear unused or duplicated from `shared` package.

## 4. Backend: Unused Variables (Lint)

- **High volume of unused `error` variables** in catch blocks (e.g., `catch (error) {}`).
- **Unused `Request` imports** in many controllers.
- **Recommendation:** Run `eslint --fix` to clean up unused imports, and replace unused catch vars with `_` or remove them.

## 5. Shared Package

- `shared/src/auth.dto.ts`, `crm.dto.ts`: Check if these are actually consumed by both `web` and `api`.
- **Observation:** `api` has a `shared_local` folder. This suggests a failed attempt at monorepo sharing, leading to code duplication between `shared/` and `api/src/shared_local/`.
- **Recommendation:** Merge `api/src/shared_local` into `@fahimo/shared` and delete `shared_local`.
