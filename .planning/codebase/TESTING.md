# Testing Patterns

**Analysis Date:** 2025-05-15

## Test Framework

### Backend (NestJS)
- **Runner:** Jest (v30.0.0)
- **Transformer:** `ts-jest` (v29.2.5)
- **Config:** `backend/package.json` (jest field)
- **Assertions:** Jest `expect`
- **Integration:** `supertest` for HTTP testing

### Frontend (Vue 3)
- **Unit Runner:** Vitest (v4.1.2)
- **E2E Runner:** Playwright (v1.58.2)
- **Assertions:** Vitest/Playwright `expect`

### Run Commands
```bash
# Backend
npm run test              # Run unit/integration tests
npm run test:e2e          # Run backend E2E tests
npm run test:cov          # View backend coverage

# Frontend
npm run test:unit         # Run vitest unit tests
npm run test:e2e          # Run playwright E2E tests
npm run test:e2e:ui       # Run playwright in UI mode
```

## Test File Organization

### Location
- **Backend:** Co-located with source files or in a `tests/` subdirectory within the module.
  - Pattern: `*.spec.ts` (Unit/Integration) or `*.e2e-spec.ts` (E2E in `test/` folder).
- **Frontend:**
  - Unit: `frontend/src/tests/` using `*.spec.ts`.
  - E2E: `frontend/tests/` using `*.spec.ts`.

### Naming
- Matches the source file name with `.spec.ts` or `.e2e-spec.ts` suffix.

## Test Structure

### Backend (Jest/Supertest)
```typescript
describe('PatientController', () => {
  let app: INestApplication;
  let service: jest.Mocked<PatientService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [PatientController],
      providers: [{ provide: PatientService, useValue: { create: jest.fn() } }],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    service = module.get(PatientService);
  });

  it('GET /api/patients should return 200', async () => {
    service.findAll.mockResolvedValue([]);
    await request(app.getHttpServer()).get('/api/patients').expect(200);
  });
});
```

### Frontend (Vitest)
```typescript
describe('Patient API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch patients', async () => {
    vi.mocked(patientsApi.getAll).mockResolvedValue([...]);
    const result = await patientsApi.getAll('clinic-1');
    expect(result).toHaveLength(...);
  });
});
```

## Mocking

### Frameworks
- **Backend:** Jest (`jest.fn()`, `jest.Mocked<T>`).
- **Frontend:** Vitest (`vi.fn()`, `vi.mock()`).

### Patterns
- **API Mocks:** Mock the API service layer in component tests.
- **Store Mocks:** Mock Pinia stores (e.g., `useUserStore`).
- **Guard Mocks:** Override NestJS guards in integration tests to bypass auth.

## Fixtures and Factories

**Test Data:**
- Defined as constants at the top of test files or in dedicated fixture files.
- Common prefix: `mock` (e.g., `mockPatient`, `mockClinicId`).

**Location:**
- Backend: `test/fixtures/` (if shared) or within `.spec.ts`.
- Frontend: `frontend/src/tests/` or `frontend/tests/fixtures/`.

## Coverage

**Requirements:**
- Backend: Global thresholds set to 90% for statements, lines, and functions; 70% for branches.
- Configured in `backend/package.json`.

**View Coverage:**
```bash
npm run test:cov
```

## Test Types

### Unit Tests
- Test isolated logic in services, utilities, and components.
- Heavily use mocking for dependencies.

### Integration Tests
- Test controllers and services interaction within NestJS modules.
- Often use `supertest` to hit real routes with mocked services/database.

### E2E Tests
- **Playwright:** Tests full user flows in the browser.
- Targets the running frontend application (usually `http://localhost:5173`).
- Covers critical paths: Login, Patient Management, Revenue calculation.

## Common Patterns

**Async Testing:**
- Always use `async`/`await`.
- Use `expect(...).rejects.toThrow()` for error paths.

**Playwright Locators:**
- Prefer `page.locator()` and `page.click('text=...')`.
- Use `expect(page).toHaveURL()` for navigation checks.

---

*Testing analysis: 2025-05-15*
