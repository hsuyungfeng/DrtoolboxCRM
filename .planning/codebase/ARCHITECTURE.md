# Architecture

**Analysis Date:** 2026-03-26

## Pattern Overview

**Overall:** Modular NestJS backend with Domain-Driven Design (DDD) layering, combined with Vue 3 frontend using Pinia for state management. Multi-tenant architecture with clinic isolation at middleware and guard levels.

**Key Characteristics:**
- Feature-based module organization (each feature is a self-contained module)
- Repository pattern via TypeORM for data access
- Event-driven architecture using NestJS EventEmitter for cross-module communication
- Clinic-isolation middleware enforcing multi-tenant boundaries at request level
- Axios-based API client on frontend with request/response interceptors for auth and clinic context
- Pinia stores for frontend state management with localStorage persistence

## Layers

**Presentation Layer (Frontend):**
- Purpose: User interface and interaction handling
- Location: `frontend/src/views/`, `frontend/src/components/`
- Contains: Vue components, page layouts, UI logic
- Depends on: Services layer, Stores, Router
- Used by: Browser/client

**Service Layer (Frontend):**
- Purpose: API communication and business logic coordination
- Location: `frontend/src/services/api.ts`, `frontend/src/services/treatments-api.ts`
- Contains: Axios configuration, HTTP method wrappers, request/response interceptors
- Depends on: axios library, Pinia stores
- Used by: Components and views

**State Management (Frontend):**
- Purpose: Application state persistence and reactive updates
- Location: `frontend/src/stores/user.ts`
- Contains: Pinia stores with user authentication, clinic context, role management
- Depends on: localStorage API, Vue reactivity
- Used by: Components via useUserStore()

**Controller Layer (Backend):**
- Purpose: HTTP request handling and routing
- Location: `backend/src/*/controllers/*.ts` (e.g., `backend/src/patients/controllers/patient.controller.ts`)
- Contains: REST endpoints, request validation, response formatting
- Depends on: Services, DTOs
- Used by: Router, middleware

**Service Layer (Backend):**
- Purpose: Business logic, data processing, and cross-service orchestration
- Location: `backend/src/*/services/*.ts`
- Contains: Core algorithms (PPF calculation, revenue rules), data transformation
- Depends on: Repositories, other services, event emitter
- Used by: Controllers, event listeners

**Repository/Data Access Layer (Backend):**
- Purpose: Database operations through TypeORM
- Location: Injected via `@InjectRepository()` decorator
- Contains: Database queries via TypeORM Repository API
- Depends on: TypeORM entities
- Used by: Services

**Entity Layer (Backend):**
- Purpose: Database schema and type definitions
- Location: `backend/src/*/entities/*.entity.ts`
- Contains: TypeORM entity classes with decorators
- Depends on: TypeORM decorators, Decimal.js
- Used by: Services, controllers (for type safety)

**Module Layer (Backend):**
- Purpose: Feature encapsulation and dependency injection
- Location: `backend/src/*/[feature].module.ts`
- Contains: Module definition with imports, controllers, providers, exports
- Depends on: NestJS, TypeOrmModule
- Used by: AppModule for composition

**Common/Infrastructure Layer (Backend):**
- Purpose: Cross-cutting concerns and utilities
- Location: `backend/src/common/`
- Contains: Exception filters, middleware, guards, interceptors, audit logging
- Depends on: NestJS core
- Used by: Application-wide, injected into modules

## Data Flow

**User Authentication & Multi-Tenant Request Flow:**

1. User submits login credentials via frontend LoginView
2. API request goes through axios interceptor which adds X-Clinic-Id header
3. ClinicAuthMiddleware validates clinicId from header/query/body and attaches to request object
4. ClinicContextGuard checks user auth and clinic access permissions
5. Controller receives request with clinicId context
6. Services filter queries by clinicId ensuring data isolation
7. Response returns to axios response interceptor which extracts data portion
8. Pinia user store updates with token, clinicId, and role
9. Frontend can now request other resources with clinic context

**Treatment Creation with Revenue & Points Trigger:**

1. Staff creates TreatmentCourse via TreatmentCourseController
2. TreatmentCourseService saves to database
3. EventEmitter emits TreatmentCompletedEvent
4. RevenueEventListener subscribes and triggers RevenueCalculationService
5. RevenueCalculationService calls RevenueRuleEngine
6. RevenueRuleEngine applies rules via PPFCalculationService
7. RevenueRecordService creates revenue records for each staff member
8. PointsService updates patient points balance via PointsTransaction
9. AuditLogService (Global module) logs all mutations

**Patient Treatment History Retrieval:**

1. PatientDetailView requests patient data via treatments-api
2. API service calls GET /api/patients/:id with clinicId header
3. PatientController.findOne() routes to PatientService
4. PatientService queries database with clinicId filter and eager-loads treatments relation
5. TypeORM returns Patient entity with nested TreatmentSession[] relations
6. Response flows through axios interceptor, Pinia store updates
7. Component renders TreatmentHistoryTab with sessions

**State Management (Frontend):**

- Pinia store (user.ts) holds: user object, token, clinicId, availableClinics
- localStorage persists token and clinicId across page refreshes
- Routes check user authentication via route guards (meta properties)
- Components access store via useUserStore() composable

## Key Abstractions

**Module Pattern (Backend):**
- Purpose: Encapsulate feature-related controllers, services, entities, and providers
- Examples: `PatientsModule`, `TreatmentsModule`, `RevenueModule`, `PointsModule`
- Pattern: Each module controls its own database entities via TypeOrmModule.forFeature(), exports public services, manages internal dependencies

**Service Pattern (Backend):**
- Purpose: Encapsulate business logic separate from HTTP concerns
- Examples: `PatientService`, `TreatmentCourseService`, `PPFCalculationService`
- Pattern: Injectable classes with repository injection, methods correspond to domain operations

**Event-Driven Pattern (Backend):**
- Purpose: Decouple modules for async, side-effect operations
- Examples: TreatmentCompletedEvent triggers RevenueEventListener and PointsService updates
- Pattern: EventEmitter.emit() from service → EventListener subscribes → triggers side effects

**Guard/Middleware Pattern (Backend):**
- Purpose: Request-level enforcement of business rules and security
- Examples: ClinicContextGuard (auth + clinic access), ClinicAuthMiddleware (clinic ID extraction)
- Pattern: Guard validates state, Middleware modifies request context

**API Client Pattern (Frontend):**
- Purpose: Centralized HTTP communication with auth/clinic headers
- Location: `frontend/src/services/api.ts`
- Pattern: Axios interceptors add Authorization and X-Clinic-Id headers, handle 401 logout

**Store Pattern (Frontend):**
- Purpose: Centralized reactive state with localStorage sync
- Location: `frontend/src/stores/user.ts`
- Pattern: Pinia defineStore with computed properties, methods that read/write localStorage

## Entry Points

**Backend Entry Point:**
- Location: `backend/src/main.ts`
- Triggers: npm start (development) or node dist/main (production)
- Responsibilities:
  - Bootstrap NestApplication via NestFactory.create(AppModule)
  - Configure global filters (HttpExceptionFilter, AllExceptionsFilter)
  - Enable CORS with origin validation
  - Register ClinicAuthMiddleware (except /api/docs and /api/health)
  - Setup Swagger documentation at /api/docs
  - Listen on PORT (default 3000)

**Frontend Entry Point:**
- Location: `frontend/src/main.ts`
- Triggers: npm run dev (development) or npm run build (production)
- Responsibilities:
  - Create Vue app instance
  - Setup Pinia store instance
  - Load Naive UI component library and styles
  - Initialize i18n for multi-language support
  - Register Vue Router
  - Mount to #app DOM element

**Database Entry Point:**
- Location: `backend/src/config/database.config.ts`
- Triggers: AppModule initialization via TypeOrmModule.forRoot()
- Responsibilities:
  - Configure database type (SQLite or PostgreSQL based on DB_TYPE env)
  - Register all entities (Patient, Treatment, Staff, Revenue*, Points*, etc.)
  - Enable synchronize in development for auto-migrations
  - Setup migrations directory

## Error Handling

**Strategy:** Structured exception hierarchy with global filters and consistent error response format.

**Patterns:**
- Custom exceptions inherit from NestJS HttpException for status code mapping
- HttpExceptionFilter catches and formats HTTP exceptions to standardized ApiErrorResponse
- AllExceptionsFilter catches unexpected errors, logs them, returns generic error response
- API responses include statusCode, message, errorCode, timestamp, path, details, errors
- Frontend axios interceptor handles specific status codes (401 logout, 403 forbidden, 404 not found)

## Cross-Cutting Concerns

**Logging:** NestJS Logger class used in middleware and services, logs to console in development

**Validation:** class-validator decorators on DTOs for automatic request validation, BadRequestException for failures

**Authentication:** JWT via passport-jwt strategy, token passed in Authorization header, validated in ClinicContextGuard

**Authorization:** Clinic isolation via ClinicContextGuard checking user.clinicId against request clinicId, role-based checks for super_admin

**Audit Logging:** AuditLogService (Global module) subscribes to mutations, records actor, action, entity type, changes to AuditLog table

**Multi-Tenancy:** ClinicAuthMiddleware extracts clinicId from header/query/body, ClinicContextGuard validates access, services always filter by clinicId in queries

---

*Architecture analysis: 2026-03-26*
