# Codebase Structure

**Analysis Date:** 2025-05-22

## Directory Layout

```
doctor-crm/
├── backend/            # NestJS Backend application
│   ├── src/            # Source code
│   │   ├── ai/         # AI integration features
│   │   ├── auth/       # Authentication and Authorization
│   │   ├── common/     # Shared filters, guards, interceptors, etc.
│   │   ├── config/     # Backend configuration (DB, etc.)
│   │   ├── patients/   # Patient management module
│   │   ├── treatments/ # Treatment management module
│   │   └── ...         # Other domain modules
│   └── test/           # E2E tests for backend
├── frontend/           # Vue 3 Frontend application
│   ├── src/            # Source code
│   │   ├── components/ # Reusable UI components
│   │   ├── services/   # API client services
│   │   ├── stores/     # Pinia state stores
│   │   ├── views/      # Page views/screens
│   │   └── ...         # Assets, router, types, utils
│   └── tests/          # E2E (Playwright) and unit tests
├── docs/               # Documentation files
└── .planning/          # GSD planning and codebase maps
```

## Directory Purposes

**backend/src/common/:**
- Purpose: Shared infrastructure and utilities used across all backend modules.
- Contains: Exception filters, guards, middlewares, audit logging, and base classes.
- Key files: `backend/src/common/filters/http-exception.filter.ts`, `backend/src/common/middlewares/clinic-auth.middleware.ts`.

**backend/src/[module]/:**
- Purpose: Domain-specific logic following the NestJS modular pattern.
- Contains: Controllers, Services, Entities, DTOs, and Repositories for a specific feature area.
- Key files: `backend/src/patients/patients.module.ts`, `backend/src/treatments/services/treatment.service.ts`.

**frontend/src/components/:**
- Purpose: Reusable Vue components.
- Contains: SFCs (.vue) for UI elements like buttons, tables, and domain-specific widgets.
- Key files: `frontend/src/components/AppLayout.vue`, `frontend/src/components/patients/PatientList.vue`.

**frontend/src/views/:**
- Purpose: Page-level components corresponding to routes.
- Contains: Layout-heavy components that orchestrate child components and stores.
- Key files: `frontend/src/views/HomeView.vue`, `frontend/src/views/PatientsView.vue`.

## Key File Locations

**Entry Points:**
- `backend/src/main.ts`: Backend bootstrap and global configuration.
- `frontend/src/main.ts`: Frontend bootstrap and plugin registration.

**Configuration:**
- `backend/src/config/database.config.ts`: Database connection settings.
- `frontend/vite.config.ts`: Vite build and development configuration.

**Core Logic:**
- `backend/src/app.module.ts`: Root module orchestrating all backend features.
- `frontend/src/router/index.ts`: Application routing definition.

**Testing:**
- `backend/test/`: Backend E2E tests.
- `frontend/tests/`: Frontend E2E tests (Playwright).
- `frontend/src/tests/`: Frontend unit tests (Vitest).

## Naming Conventions

**Files:**
- Backend: `[domain].[type].ts` (e.g., `patient.controller.ts`, `auth.service.ts`).
- Frontend Components: PascalCase for SFCs (e.g., `PatientDetails.vue`).
- Frontend Scripts: kebab-case for utilities and services (e.g., `api-client.ts`).

**Directories:**
- kebab-case (e.g., `doctor-toolbox-sync`, `treatment-templates`).

## Where to Add New Code

**New Feature (e.g., "Pharmacy"):**
- Backend: Create `backend/src/pharmacy/` with `pharmacy.module.ts`, then add subdirectories for `controllers`, `services`, `entities`, `dto`.
- Frontend: Add a new view in `frontend/src/views/PharmacyView.vue`, components in `frontend/src/components/pharmacy/`, and a store in `frontend/src/stores/pharmacy.ts`.

**New Utility:**
- Shared Backend: `backend/src/common/utils/` (if it exists, or create it).
- Shared Frontend: `frontend/src/utils/`.

**New API Endpoint:**
- Backend: Add to relevant controller in `backend/src/[module]/controllers/`.
- Frontend: Add to relevant service in `frontend/src/services/`.

## Special Directories

**.planning/:**
- Purpose: Stores project metadata, roadmap, and codebase maps.
- Generated: No (managed by GSD).
- Committed: Yes.

**backend/migrations/:**
- Purpose: TypeORM database migrations.
- Generated: Yes (via `typeorm migration:generate`).
- Committed: Yes.

---

*Structure analysis: 2025-05-22*
