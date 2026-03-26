# Codebase Structure

**Analysis Date:** 2026-03-26

## Directory Layout

```
doctor-crm/
├── backend/                          # NestJS API server
│   ├── src/
│   │   ├── main.ts                  # Application bootstrap
│   │   ├── app.module.ts            # Root module
│   │   ├── app.controller.ts        # Root controller
│   │   ├── app.service.ts           # Root service
│   │   ├── config/                  # Configuration
│   │   │   └── database.config.ts   # TypeORM configuration
│   │   ├── common/                  # Infrastructure & cross-cutting
│   │   │   ├── audit/               # Audit logging
│   │   │   ├── clinic/              # Clinic context utilities
│   │   │   ├── exceptions/          # Custom exceptions
│   │   │   ├── filters/             # Global exception filters
│   │   │   ├── guards/              # Auth & clinic context guards
│   │   │   ├── interceptors/        # Request/response interceptors
│   │   │   ├── interfaces/          # Type definitions
│   │   │   └── middlewares/         # HTTP middlewares
│   │   ├── auth/                    # Authentication module
│   │   ├── patients/                # Patient management feature
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── entities/
│   │   │   ├── dto/
│   │   │   └── patients.module.ts
│   │   ├── treatments/              # Treatment & therapy management
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── entities/
│   │   │   ├── dto/
│   │   │   └── treatments.module.ts
│   │   ├── treatment-templates/     # Treatment template definitions
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── entities/
│   │   │   ├── dto/
│   │   │   └── treatment-templates.module.ts
│   │   ├── staff/                   # Staff management
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── entities/
│   │   │   ├── dto/
│   │   │   └── staff.module.ts
│   │   ├── revenue/                 # Revenue & PPF distribution
│   │   │   ├── controllers/
│   │   │   ├── services/            # Including RevenueRuleEngine
│   │   │   ├── entities/
│   │   │   ├── dto/
│   │   │   ├── listeners/           # Event listeners
│   │   │   └── revenue.module.ts
│   │   ├── points/                  # Points/loyalty system
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── entities/
│   │   │   ├── dto/
│   │   │   └── points.module.ts
│   │   ├── referrals/               # Patient referral tracking
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── entities/
│   │   │   └── referrals.module.ts
│   │   ├── ai/                      # AI transcription service
│   │   │   ├── ai-transcription.service.ts
│   │   │   ├── prompt-templates.ts
│   │   │   └── ai.module.ts
│   │   ├── notifications/           # Notification service
│   │   ├── events/                  # Event definitions
│   │   │   ├── treatment-completed.event.ts
│   │   │   └── session-completed.event.ts
│   │   └── migrations/              # Database migrations
│   ├── test/                        # E2E tests
│   │   ├── jest-e2e.json
│   │   └── app.e2e-spec.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   └── database.sqlite              # SQLite database (dev)
├── frontend/                        # Vue 3 client
│   ├── src/
│   │   ├── main.ts                 # Application bootstrap
│   │   ├── App.vue                 # Root component
│   │   ├── style.css               # Global styles
│   │   ├── views/                  # Page components
│   │   │   ├── HomeView.vue
│   │   │   ├── PatientsView.vue
│   │   │   ├── PatientDetailView.vue
│   │   │   ├── TreatmentsView.vue
│   │   │   ├── ScheduleView.vue
│   │   │   ├── TreatmentTemplatesView.vue
│   │   │   ├── StaffView.vue
│   │   │   ├── RevenueView.vue
│   │   │   ├── LoginView.vue
│   │   │   └── NotFoundView.vue
│   │   ├── components/             # Reusable components
│   │   │   ├── AppLayout.vue       # Main layout wrapper
│   │   │   ├── AppHeader.vue       # Header with navigation
│   │   │   ├── AppSidebar.vue      # Sidebar navigation
│   │   │   ├── patients/           # Patient-related components
│   │   │   │   ├── TreatmentSessionTable.vue
│   │   │   │   ├── SessionEditModal.vue
│   │   │   │   └── TreatmentHistoryTab.vue
│   │   │   ├── TreatmentModal.vue
│   │   │   ├── TreatmentSessionsManager.vue
│   │   │   └── HelloWorld.vue
│   │   ├── router/                 # Vue Router setup
│   │   │   └── index.ts            # Route definitions
│   │   ├── stores/                 # Pinia stores
│   │   │   ├── index.ts            # Store exports
│   │   │   └── user.ts             # User/auth state
│   │   ├── services/               # API communication
│   │   │   ├── api.ts              # Axios client & interceptors
│   │   │   └── treatments-api.ts   # Treatment API methods
│   │   ├── types/                  # TypeScript type definitions
│   │   ├── utils/                  # Utility functions
│   │   ├── locales/                # i18n translation files
│   │   ├── constants/              # App constants
│   │   └── assets/                 # Images, fonts, etc.
│   ├── index.html                  # HTML entry point
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts              # Vite build config
│   ├── vitest.config.ts            # Vite test config
│   └── playwright.config.ts        # E2E test config
├── docs/                           # Documentation
├── .github/workflows/              # CI/CD workflows
├── .planning/                      # GSD planning documents
│   └── codebase/                   # This directory
├── docker-compose.yml              # Docker compose (dev)
├── docker-compose.prod.yml         # Docker compose (prod)
├── .env.development                # Dev environment vars
├── .env.production                 # Prod environment vars
├── .env.example                    # Environment template
├── .gitignore                      # Git ignore rules
├── README.md                       # Project documentation
└── DEPLOYMENT.md                   # Deployment guide
```

## Directory Purposes

**backend/src/:**
- Purpose: Main NestJS application source code
- Contains: Modules, controllers, services, entities, DTOs

**backend/src/common/:**
- Purpose: Cross-cutting infrastructure and utilities
- Contains: Exception handlers, middleware, guards, interceptors, audit logging, clinic isolation logic

**backend/src/auth/:**
- Purpose: Authentication and authorization
- Contains: Passport strategies, JWT handling, login logic

**backend/src/patients/:**
- Purpose: Patient management feature
- Contains: CRUD operations for patients, patient-related queries

**backend/src/treatments/:**
- Purpose: Treatment courses and sessions management
- Contains: Treatment creation, session tracking, PPF calculation, course templates

**backend/src/staff/:**
- Purpose: Staff member management
- Contains: Staff CRUD, treatment assignments, role management

**backend/src/revenue/:**
- Purpose: Revenue calculation and distribution
- Contains: Revenue rules engine, PPF calculations, revenue records, audit adjustments

**backend/src/points/:**
- Purpose: Loyalty points system
- Contains: Point transactions, balance tracking, redemption rules

**backend/src/ai/:**
- Purpose: AI-powered features
- Contains: Transcription service, LLM prompt templates

**backend/src/common/audit/:**
- Purpose: Audit trail logging
- Contains: AuditLog entity, AuditLogService, global audit subscription

**frontend/src/views/:**
- Purpose: Page-level components
- Contains: One component per route, handles layout and composition

**frontend/src/components/:**
- Purpose: Reusable UI components
- Contains: Modular, composable Vue components used across views

**frontend/src/services/:**
- Purpose: API communication
- Contains: Axios configuration, request/response interceptors, API method wrappers

**frontend/src/stores/:**
- Purpose: Pinia state management
- Contains: Reactive state, localStorage persistence, computed derived state

**frontend/src/router/:**
- Purpose: Route definitions and navigation
- Contains: Vue Router configuration, route guards, meta properties

**frontend/src/types/:**
- Purpose: TypeScript type definitions
- Contains: API response types, domain models, DTO interfaces

## Key File Locations

**Entry Points:**
- `backend/src/main.ts`: Backend bootstrap and configuration
- `backend/src/app.module.ts`: Root module that imports all feature modules
- `frontend/src/main.ts`: Frontend bootstrap and Pinia/Router initialization
- `frontend/index.html`: HTML template

**Configuration:**
- `backend/src/config/database.config.ts`: TypeORM/database setup
- `frontend/vite.config.ts`: Frontend build configuration
- `.env.development`, `.env.production`: Environment variables

**Core Logic:**
- `backend/src/treatments/services/ppf-calculation.service.ts`: PPF revenue calculation
- `backend/src/revenue/services/revenue-rule-engine.service.ts`: Complex revenue rule evaluation
- `backend/src/patients/services/patient.service.ts`: Core patient operations
- `frontend/src/services/api.ts`: Centralized API client with auth/clinic context

**Testing:**
- `backend/test/`: NestJS E2E tests
- `backend/src/**/*.spec.ts`: Unit tests (co-located with source)
- `frontend/e2e/`: Playwright E2E tests

**Authentication & Authorization:**
- `backend/src/common/middlewares/clinic-auth.middleware.ts`: Clinic ID extraction & validation
- `backend/src/common/guards/clinic-context.guard.ts`: Auth and clinic access verification
- `frontend/src/stores/user.ts`: Frontend auth state and clinic context

**Multi-Tenancy:**
- `backend/src/common/clinic/`: Clinic context utilities
- Database query filters by `clinicId` in all services

## Naming Conventions

**Files:**
- Feature modules: `[feature].module.ts` (e.g., `patients.module.ts`)
- Controllers: `[feature].controller.ts` or `[feature]-[type].controller.ts` (e.g., `patient.controller.ts`, `treatment-course.controller.ts`)
- Services: `[feature].service.ts` or `[feature]-[type].service.ts` (e.g., `patient.service.ts`, `ppf-calculation.service.ts`)
- Entities: `[feature].entity.ts` (e.g., `patient.entity.ts`, `treatment-course.entity.ts`)
- DTOs: `[action]-[feature].dto.ts` (e.g., `create-patient.dto.ts`, `update-patient.dto.ts`)
- Event listeners: `[feature]-event.listener.ts` (e.g., `revenue-event.listener.ts`)
- Vue components: `[PascalCase].vue` (e.g., `AppLayout.vue`, `TreatmentSessionTable.vue`)
- API services: `[feature]-api.ts` (e.g., `treatments-api.ts`)
- Test files: `*.spec.ts` or `*.e2e-spec.ts`

**Directories:**
- Feature directories: kebab-case, match module name (e.g., `patients/`, `treatment-templates/`)
- Component subdirectories: kebab-case by feature (e.g., `components/patients/`)
- Sub-layer directories: lowercase, functional names (e.g., `controllers/`, `services/`, `entities/`)

**Classes & Functions:**
- Controllers: `[Feature]Controller` (e.g., `PatientController`)
- Services: `[Feature]Service` or `[Feature][Type]Service` (e.g., `PatientService`, `PPFCalculationService`)
- Entities: `[Feature]` (e.g., `Patient`, `TreatmentCourse`)
- DTOs: `[Action][Feature]Dto` (e.g., `CreatePatientDto`, `UpdatePatientDto`)
- Vue components: `[PascalCase]` matching filename (e.g., `AppLayout`, `TreatmentSessionTable`)
- Pinia stores: `use[Feature]Store` composable (e.g., `useUserStore`)

**Constants & Variables:**
- Constants: SCREAMING_SNAKE_CASE (e.g., `CLINIC_ID_STORAGE_KEY`)
- Variables & functions: camelCase (e.g., `clinicId`, `validateClinicId`)
- Component props: camelCase (e.g., `:patient="patient"`)
- CSS class names: kebab-case (e.g., `patient-list`, `treatment-card`)

## Where to Add New Code

**New Feature (e.g., Appointments):**
- Primary code: `backend/src/appointments/`
  - Create `appointments.module.ts` following pattern in `patients.module.ts`
  - Create `controllers/appointments.controller.ts` with CRUD endpoints
  - Create `services/appointments.service.ts` with business logic
  - Create `entities/appointment.entity.ts` with TypeORM decorators
  - Create `dto/create-appointment.dto.ts` and `update-appointment.dto.ts`
  - Add module to `app.module.ts` imports array
- Tests: `backend/src/appointments/**/*.spec.ts` (co-located with source)
- Frontend:
  - Create `frontend/src/views/AppointmentsView.vue`
  - Add route to `frontend/src/router/index.ts`
  - Create `frontend/src/components/appointments/` for reusable components
  - Add API methods to `frontend/src/services/api.ts`

**New Component/Module (Frontend):**
- Implementation: `frontend/src/components/[feature]/[ComponentName].vue`
- Use Naive UI components (n-button, n-form, etc.)
- Follow i18n pattern with t() function for labels
- Example location: `frontend/src/components/patients/PatientFormModal.vue`

**Utilities & Helpers:**
- Shared helpers: `backend/src/common/utils/` or create feature-specific utils
- Frontend utilities: `frontend/src/utils/` for shared functions, `frontend/src/types/` for types
- Example: `frontend/src/utils/date-formatter.ts` for date utilities

**Cross-Module Service:**
- Create in `backend/src/common/services/` if used by multiple modules
- Export from module, inject via provider declaration
- Example: AuditLogService in `backend/src/common/audit/`

**Event Listener for Side Effects:**
- Create `backend/src/[module]/listeners/[event]-[listener].listener.ts`
- Subscribe in module's providers array
- Use EventEmitter.on() in constructor to listen for events
- Example: `backend/src/revenue/listeners/revenue-event.listener.ts`

## Special Directories

**backend/migrations/:**
- Purpose: Database schema migrations
- Generated: TypeORM generates, manually created for custom migrations
- Committed: Yes, source controlled for reproducible deployments

**backend/dist/:**
- Purpose: Compiled JavaScript output
- Generated: Yes, from npm run build
- Committed: No, in .gitignore

**frontend/dist/:**
- Purpose: Built frontend bundle
- Generated: Yes, from npm run build
- Committed: No, in .gitignore

**backend/coverage/:**
- Purpose: Jest test coverage reports
- Generated: Yes, from npm run test:cov
- Committed: No, in .gitignore

**frontend/node_modules/, backend/node_modules/:**
- Purpose: Installed dependencies
- Generated: Yes, from npm install
- Committed: No, in .gitignore

**docs/:**
- Purpose: Project documentation and guides
- Generated: No, manually maintained
- Committed: Yes

**.planning/codebase/:**
- Purpose: GSD codebase analysis documents (this directory)
- Generated: Programmatically by GSD tools
- Committed: Yes, for developer reference

---

*Structure analysis: 2026-03-26*
