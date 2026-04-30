# Coding Conventions

**Analysis Date:** 2025-05-15

## Naming Patterns

### Files
- **Backend (NestJS):** Kebab-case with category suffix.
  - Controllers: `[domain].controller.ts` (e.g., `patient.controller.ts`)
  - Services: `[domain].service.ts` (e.g., `patient-search.service.ts`)
  - Entities: `[domain].entity.ts` (e.g., `patient.entity.ts`)
  - DTOs: `[action]-[domain].dto.ts` (e.g., `create-patient.dto.ts`)
  - Modules: `[domain].module.ts` (e.g., `patients.module.ts`)
- **Frontend (Vue 3):**
  - Views/Components: PascalCase (e.g., `PatientsView.vue`, `AppHeader.vue`)
  - Services/Stores/Types: camelCase or kebab-case (e.g., `api.ts`, `medical-orders-api.ts`, `user.ts`)

### Functions
- **General:** camelCase with verb prefix.
  - Examples: `searchPatients`, `getPatientProfile`, `handleCreate`, `loadPatients`
- **Asynchronous:** Should return `Promise<T>`.

### Variables
- **General:** camelCase.
- **Constants:** SCREAMING_SNAKE_CASE (e.g., `CLINIC_ID_KEY`).
- **Refs (Vue):** camelCase (e.g., `isLoading`, `patientList`).

### Types and Classes
- **Classes/Interfaces/Types:** PascalCase (e.g., `PatientController`, `Patient`, `CreatePatientDto`).
- **Interfaces:** Prefix with `I` is sometimes used (e.g., `IPatient`), but literal naming (e.g., `Patient`) is more common in entities.
- **Enums:** PascalCase.

## Code Style

### Formatting
- **Tool:** Prettier (v3.4.2)
- **Settings:** 2 spaces, single quotes, 80 character line length, trailing commas where applicable.
- **Commands:**
  - Backend: `npm run format`
  - Frontend: `npm run format` (if configured, or via IDE)

### Linting
- **Tool:** ESLint (v9.18.0)
- **Backend Rules:** Defined in `backend/eslint.config.mjs`. Includes TypeScript recommended rules and Prettier integration.
- **Frontend Rules:** standard Vue/TS linting.

## Import Organization

### Order
1. External libraries (NestJS, Vue, etc.)
2. Third-party packages (TypeORM, Naive UI, Pinia)
3. Type imports (`import type { ... }`)
4. Internal modules/services (using `@/` for frontend)
5. Relative imports

### Path Aliases
- **Frontend:** `@/` points to `src/` (configured in `vite.config.ts` and `tsconfig.json`).
- **Backend:** Relative paths (`../../`) or `@/` if configured (check `tsconfig.json`).

## Error Handling

### Backend (NestJS)
- Use built-in HTTP Exceptions: `NotFoundException`, `BadRequestException`, `ForbiddenException`.
- Multi-tenancy isolation: Handled by `ClinicContextGuard` in `backend/src/common/guards/clinic-context.guard.ts`.
- Response format: Consists of `statusCode`, `message`, and optional `data`.

### Frontend (Vue)
- Use UI notification services: `useMessage` and `useDialog` from Naive UI.
- Try-catch blocks in views to handle API errors and show feedback.

## Logging

**Framework:** NestJS `Logger` (Backend) or `console` (Frontend).

**Patterns:**
- Use `private readonly logger = new Logger(ClassName.name)` in services.
- Log critical actions (e.g., "Patient created", "Transaction failed").

## Comments

**When to Comment:**
- Use JSDoc for complex logic and API endpoints.
- Comments are frequently written in Traditional Chinese.

**JSDoc/TSDoc:**
```typescript
/**
 * 搜尋患者
 * @param keyword 關鍵字
 * @param clinicId 診所 ID
 */
```

## Function Design

**Size:** Aim for single-responsibility functions (under 50 lines).

**Parameters:** Use DTOs for multi-parameter functions to improve readability and validation.

**Return Values:** Consistent response wrappers in controllers.

## Module Design

**Exports:** NestJS modules should explicitly export services intended for use in other modules.

**Barrel Files:** `index.ts` files are used in some directories to simplify imports.

---

*Convention analysis: 2025-05-15*
