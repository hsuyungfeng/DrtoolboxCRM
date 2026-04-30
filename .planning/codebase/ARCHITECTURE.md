# Architecture

**Analysis Date:** 2025-05-22

## Pattern Overview

**Overall:** Modular Monolith (Backend) + Component-based Single Page Application (Frontend)

**Key Characteristics:**
- **Domain-Driven Design (lite):** Backend organized into functional modules (Patients, Treatments, Staff, etc.).
- **Clinic-based Isolation:** Multi-tenancy achieved through clinic-specific context and middleware.
- **Event-Driven:** Uses NestJS `EventEmitter` for decoupled side effects (e.g., notifications, audit logs).

## Layers

**API Layer (Backend):**
- Purpose: Entry point for HTTP requests, routing, and request validation.
- Location: `backend/src/*/controllers/`
- Contains: NestJS Controllers, DTOs, Swagger decorators.
- Depends on: Services, DTOs.
- Used by: Frontend API services.

**Business Logic Layer (Backend):**
- Purpose: Core application logic, business rules, and orchestration.
- Location: `backend/src/*/services/`
- Contains: NestJS Providers/Services.
- Depends on: Repositories, EventEmitter, other Services.
- Used by: Controllers, other Services.

**Data Access Layer (Backend):**
- Purpose: Database interaction and persistence logic.
- Location: `backend/src/*/repositories/` and `backend/src/*/entities/`
- Contains: TypeORM Entities, Custom Repositories.
- Depends on: TypeORM.
- Used by: Services.

**Presentation Layer (Frontend):**
- Purpose: User interface and user interaction.
- Location: `frontend/src/views/` and `frontend/src/components/`
- Contains: Vue SFCs (.vue), Naive UI components.
- Depends on: Stores, Services.

**State Management Layer (Frontend):**
- Purpose: Client-side state and reactive data.
- Location: `frontend/src/stores/`
- Contains: Pinia stores.
- Depends on: Services (API).

## Data Flow

**Request-Response Flow:**

1. Frontend Component triggers an action (e.g., clicking "Save").
2. Component calls a method in a Pinia Store (`frontend/src/stores/`).
3. Store calls an API Service (`frontend/src/services/`) using Axios.
4. Backend `ClinicAuthMiddleware` intercepts the request to set clinic context.
5. Backend Controller (`backend/src/*/controllers/`) validates the DTO.
6. Controller calls the Service (`backend/src/*/services/`).
7. Service performs business logic and interacts with the Repository (`backend/src/*/repositories/`).
8. Service might emit an event (`EventEmitter2`).
9. Response flows back through the Controller to the Frontend Store, then to the Component.

**State Management:**
- **Server State:** Handled by NestJS Services and TypeORM, persisted in SQLite.
- **Client State:** Handled by Pinia stores for global state (e.g., user profile, revenue stats) and local component state for UI-specific data.

## Key Abstractions

**Clinic Context:**
- Purpose: Ensures data isolation between different medical clinics.
- Examples: `backend/src/common/middlewares/clinic-auth.middleware.ts`, `backend/src/common/clinic/clinic-context.guard.ts`.
- Pattern: Request-scoped context / Middleware.

**Audit Logging:**
- Purpose: Tracks all critical actions within the system for compliance.
- Examples: `backend/src/common/audit/audit-log.service.ts`, `backend/src/common/audit/audit.module.ts`.
- Pattern: Event Listeners / Interceptors.

## Entry Points

**Backend Main:**
- Location: `backend/src/main.ts`
- Triggers: Node.js process start.
- Responsibilities: Initialize NestJS app, register global filters, set up Swagger, enable CORS, start listening on port.

**Frontend Main:**
- Location: `frontend/src/main.ts`
- Triggers: Browser load.
- Responsibilities: Initialize Vue app, register Pinia, Naive UI, i18n, and Router.

## Error Handling

**Strategy:** Global Exception Filters and Centralized Error Definitions.

**Patterns:**
- **Global Filters:** `backend/src/common/filters/all-exceptions.filter.ts` (catch-all), `backend/src/common/filters/http-exception.filter.ts` (REST errors).
- **Validation Errors:** `backend/src/common/filters/validation-error.filter.ts` specifically handles `class-validator` issues.
- **Custom Exceptions:** `backend/src/common/exceptions/` (e.g., `BusinessRuleException`).

## Cross-Cutting Concerns

**Logging:** Standardized through NestJS Logger and custom `AuditLogService` for business events.
**Validation:** DTO-based validation using `class-validator` and `class-transformer` in the backend.
**Authentication:** JWT-based authentication with Clinic ID isolation.
**Synchronization:** `DoctorToolboxSyncModule` handles integration with external "Doctor Toolbox" system.

---

*Architecture analysis: 2025-05-22*
