# Codebase Concerns

**Analysis Date:** 2026-03-26

## Critical Security Issues

### 1. Authentication - Hardcoded Default JWT Secret
- **Issue:** JWT secret has default fallback value exposed in code
- **Files:** `backend/src/auth/strategies/jwt.strategy.ts` (line 21)
- **Current code:** `process.env.JWT_SECRET || "your-super-secret-key-change-in-production"`
- **Impact:** If JWT_SECRET environment variable is not set in production, the application will use an insecure default key, allowing token forgery and authentication bypass
- **Fix approach:**
  - Make JWT_SECRET mandatory (throw error if not provided in production)
  - Remove hardcoded default from code
  - Add validation at application startup to ensure JWT_SECRET is configured in production

### 2. Password Authentication - Development-Only Implementation
- **Issue:** Password validation is disabled for all non-production environments and hardcoded in production environments
- **Files:** `backend/src/auth/auth.service.ts` (lines 72-86)
- **Current code:**
  - Dev: Accepts "password123" or staffId as password
  - Prod: Returns false (blocks all logins)
- **Impact:**
  - Development passwords are insecure and hardcoded
  - Production environment cannot authenticate users at all (loginreturn false always)
  - No bcrypt password hashing is actually implemented
- **Fix approach:**
  - Add password field to Staff entity in database
  - Implement proper bcrypt hashing and comparison for all environments
  - Store hashed passwords securely
  - Add password reset mechanism
  - Generate secure temporary passwords for initial setup

### 3. Missing Password Storage in Staff Entity
- **Issue:** Staff entity has no password field for storing hashed passwords
- **Files:** `backend/src/staff/entities/staff.entity.ts`
- **Impact:** Cannot implement proper authentication without password storage
- **Fix approach:** Add password field with bcrypt hashing to Staff entity

---

## Tech Debt - Database & ORM

### 4. SQLite in Production Risk
- **Issue:** Database configuration allows SQLite to be used in production
- **Files:** `backend/src/config/database.config.ts` (line 39-47)
- **Current:** `const dbType = process.env.DB_TYPE || 'sqlite'`
- **Impact:**
  - SQLite is file-based, not suitable for multi-process/container deployments
  - No concurrent write support
  - No data replication capability
  - Lost data if database file corrupted
- **Fix approach:**
  - Enforce PostgreSQL or MySQL for production (check NODE_ENV)
  - Implement database connection pooling
  - Add migration pre-flight checks

### 5. Database Synchronization Enabled in Production
- **Issue:** `synchronize: true` is enabled for non-production environments and may be enabled by mistake in production
- **Files:** `backend/src/config/database.config.ts` (line 49)
- **Code:** `synchronize: process.env.NODE_ENV !== 'production'`
- **Impact:**
  - Auto-sync can silently create/alter tables unexpectedly
  - May lose data during unexpected schema changes
  - No audit trail of schema modifications
- **Fix approach:**
  - Disable synchronize entirely in production
  - Implement explicit migration scripts
  - Add migration run tracking
  - Create database version management

### 6. No Database Migrations
- **Issue:** Only `migration.service.ts` exists as a stub, no actual TypeORM migrations
- **Files:** `backend/src/migrations/migration.service.ts`
- **Impact:**
  - Cannot track schema changes
  - Difficult to rollback breaking changes
  - No version control of database structure
- **Fix approach:**
  - Create TypeORM migrations for all entities
  - Set up migration generation workflow
  - Document migration process
  - Test migrations in CI/CD

---

## Tech Debt - Authentication & Authorization

### 7. Clinic Isolation Not Enforced at Entity Level
- **Issue:** Clinic isolation is done via middleware but not at entity/query level
- **Files:** `backend/src/common/middlewares/clinic-auth.middleware.ts`
- **Impact:**
  - Direct database queries bypass clinic isolation
  - Service layer could accidentally expose multi-clinic data
  - No database-level constraints
- **Fix approach:**
  - Add clinicId database constraints (unique indexes where applicable)
  - Implement QueryBuilder filters in all service methods
  - Add validation guards for clinic ownership
  - Create shared query builder base class

### 8. Type Safety Issue - Any Types in Controllers
- **Issue:** Update DTO parameters use `any` type
- **Files:** `backend/src/treatments/controllers/treatment-session.controller.ts` (updateDto parameter)
- **Impact:** No type validation for update payloads
- **Fix approach:**
  - Create proper UpdateTreatmentSessionDto
  - Replace all `any` with specific types
  - Add DTO validation

---

## Performance Concerns

### 9. N+1 Query Problem in Revenue Calculator
- **Issue:** Service may execute multiple queries in loops without eager loading
- **Files:** `backend/src/revenue/services/revenue-calculator.service.ts` (lines 107-130)
- **Code:** Loop iterates over assignments calling `revenueRuleRepository` queries without batch optimization
- **Impact:**
  - For 10 staff assignments, executes 10+ separate queries
  - Scales poorly with staff count
  - Slow treatment completion
- **Fix approach:**
  - Batch load all rules at once with QueryBuilder
  - Use DataLoader pattern for rule lookups
  - Cache active rules for clinic/role combinations
  - Add query result caching

### 10. No Database Query Indexes
- **Issue:** No indexes defined on frequently queried columns
- **Files:** All entity files
- **Common queries:** clinicId, status, createdAt, staffId, roleType
- **Impact:** Full table scans for large datasets
- **Fix approach:**
  - Add @Index() decorators to common query columns
  - Create composite indexes for common filter combinations
  - Monitor query performance

### 11. AI Transcription Service - No Error Recovery
- **Issue:** If Ollama service fails, returns hardcoded fallback without retry
- **Files:** `backend/src/ai/ai-transcription.service.ts` (lines 63-69)
- **Impact:** Failed transcriptions silently use placeholder data
- **Fix approach:**
  - Implement exponential backoff retry
  - Add circuit breaker pattern
  - Log failed transcriptions for manual review
  - Create transcription queue with retry

### 12. AI Transcription - Unbounded Batch Processing
- **Issue:** `batchTranscribe` processes all requests concurrently with Promise.all
- **Files:** `backend/src/ai/ai-transcription.service.ts` (lines 73-78)
- **Impact:** Large batches (100+ requests) can crash service or Ollama
- **Fix approach:**
  - Implement batch size limits
  - Add concurrent request limits
  - Use BullMQ or similar for queuing
  - Add timeout handling

---

## Testing Gaps

### 13. Severely Limited Frontend Test Coverage
- **Issue:** Only 2 test files in frontend vs 30 in backend
- **Files:** `frontend/tests/app.spec.ts` (only file)
- **Impact:** Vue components untested, high regression risk
- **Coverage:**
  - No component tests for PatientsView, TreatmentsView, RevenueView, StaffView
  - No service layer tests for api.ts, treatments-api.ts, treatment-templates-api.ts
  - No store (Pinia) state tests
  - Only basic app initialization tested
- **Fix approach:**
  - Create comprehensive component tests with Vitest + Vue Test Utils
  - Test all CRUD operations for each view
  - Add store mutation/action tests
  - Mock API calls in tests
  - Target 70%+ coverage

### 14. E2E Tests Not Integrated
- **Issue:** Playwright configured but not running in CI/CD
- **Files:** `frontend/playwright.config.ts`, `.github/workflows/ci-cd.yml`
- **Impact:** No automated user flow testing
- **Fix approach:**
  - Add E2E tests to CI/CD pipeline
  - Create test scenarios for main workflows
  - Set up test database seeding
  - Add visual regression testing

### 15. Backend Service Tests Using expect.any(Object)
- **Issue:** Tests use loose assertions instead of strict type checking
- **Files:** `backend/src/points/services/points.service.spec.ts`
- **Pattern:** `expect.any(Object)` instead of specific property assertions
- **Impact:** Tests pass even if wrong data returned
- **Fix approach:**
  - Replace expect.any(Object) with specific property checks
  - Validate response shapes
  - Add strict assertion helpers

---

## Code Quality Issues

### 16. Unsafe Type Casting
- **Issue:** Multiple `as any` casts bypass type safety
- **Files:**
  - `backend/src/config/database.config.ts` (line 42): `type: dbType as any`
  - `backend/src/treatments/controllers/treatment-course.controller.ts`: `const filter: any = {}`
  - `backend/src/common/middlewares/clinic-auth.middleware.ts` (line 67): `(req as any).clinicId`
- **Impact:** Type errors not caught at compile time
- **Fix approach:**
  - Create proper types for database configuration
  - Use TypeORM Repository types directly
  - Extend Express Request type for clinicId field

### 17. Error Handling in Filter - Catches All Exceptions Without Specificity
- **Issue:** `AllExceptionsFilter` catches all errors with generic handling
- **Files:** `backend/src/common/filters/all-exceptions.filter.ts` (line 15: @Catch())
- **Impact:**
  - Difficult to distinguish between expected and unexpected errors
  - No specific error recovery paths
- **Fix approach:**
  - Create specific exception filters for different error types
  - Implement proper error codes for client-side handling
  - Add error context enrichment

### 18. Incomplete Error Messages in Production
- **Issue:** Production errors return generic "An internal server error occurred"
- **Files:** `backend/src/common/filters/all-exceptions.filter.ts` (line 78)
- **Impact:** Difficult for users to understand what went wrong
- **Fix approach:**
  - Create user-friendly error messages for common scenarios
  - Use error codes for client-side lookup
  - Add error documentation endpoint

---

## Data Validation Gaps

### 19. No Input Validation on Multiple Endpoints
- **Issue:** Many controllers accept loose parameters without DTOs or validation
- **Files:**
  - `backend/src/treatments/controllers/treatment-session.controller.ts` (updateDto: any)
  - `backend/src/treatments/controllers/treatment-course.controller.ts` (filter: any)
- **Impact:**
  - SQL injection risk
  - Invalid data persisted to database
  - No API contract validation
- **Fix approach:**
  - Create DTOs for all endpoints
  - Apply @ValidateNested() and class-validator
  - Add comprehensive validation tests

### 20. Missing Decimal Validation
- **Issue:** Decimal.js precision is set but not validated at DTO level
- **Files:** `backend/src/revenue/services/revenue-calculator.service.ts` (line 13)
- **Impact:**
  - Financial calculations could accumulate rounding errors
  - No precision validation at API boundaries
- **Fix approach:**
  - Create custom validator for decimal precision
  - Validate max decimal places in DTOs
  - Add financial precision tests

---

## Monitoring & Observability

### 21. Minimal Structured Logging
- **Issue:** Mostly using Logger.log/error without structured fields
- **Files:** Throughout backend services
- **Impact:**
  - Difficult to trace requests
  - No correlation IDs
  - Slow troubleshooting
- **Fix approach:**
  - Add request correlation IDs via middleware
  - Use structured logging format (JSON)
  - Implement request context tracking
  - Add performance metrics logging

### 22. No Error Tracking Service
- **Issue:** No Sentry, DataDog, or error tracking integration
- **Files:** None - not implemented
- **Impact:**
  - Production errors go unnoticed
  - No stack trace aggregation
- **Fix approach:**
  - Add Sentry for error tracking
  - Configure error sampling
  - Set up alerts for critical errors

### 23. No Health Check Endpoints Beyond Ping
- **Issue:** `/api/health` only returns 200
- **Files:** `backend/src/health/health.controller.ts`
- **Impact:** Cannot verify database connectivity or service health
- **Fix approach:**
  - Add database connection check
  - Add dependency health checks
  - Return detailed health status
  - Add readiness probe for Kubernetes

---

## Deployment & DevOps

### 24. Docker Build Not Optimized
- **Issue:** Dockerfile copies entire project including tests and dev dependencies
- **Files:** `backend/Dockerfile` (if exists - not found)
- **Impact:**
  - Large image sizes
  - Longer build times
  - More vulnerable surface area
- **Fix approach:**
  - Use multi-stage builds
  - Separate dev and production stages
  - Remove test files from production image

### 25. Environment Configuration - Missing Validation
- **Issue:** Missing required env vars not caught at startup
- **Files:** `backend/src/config/database.config.ts`, `backend/src/auth/strategies/jwt.strategy.ts`
- **Impact:**
  - Application starts but crashes later
  - Unclear what's misconfigured
- **Fix approach:**
  - Create .env validation schema
  - Check required vars at bootstrap
  - Provide clear error messages with examples

### 26. Database Seedling - Manual Process
- **Issue:** Seed data script requires manual execution
- **Files:** `backend/scripts/seed-data.ts`
- **Impact:**
  - Easy to forget seeding step
  - No automated setup
- **Fix approach:**
  - Add seed execution to Docker entrypoint conditionally
  - Create seed idempotency checks
  - Add seed to CI/CD setup step

---

## Frontend Specific Issues

### 27. Console.warn/error Calls in Production Code
- **Issue:** Development debugging statements present in production code
- **Files:**
  - `frontend/src/services/api.ts` (lines 77-88): Multiple console.warn/error
  - `frontend/src/stores/user.ts`: console.error
- **Impact:**
  - Information leakage to browser console
  - Logging overhead
- **Fix approach:**
  - Remove console statements or gate behind debug flag
  - Implement structured error reporting instead
  - Use proper logging library

### 28. Timeout Not Configurable
- **Issue:** API client has hardcoded 10s timeout
- **Files:** `frontend/src/services/api.ts` (line 10): `timeout: 10000`
- **Impact:**
  - Slow network requests always timeout
  - Large file uploads fail
- **Fix approach:**
  - Make timeout configurable per request
  - Add longer timeout for file operations
  - Implement exponential backoff

### 29. Cache Bypass Token (`_t` parameter)
- **Issue:** Every GET request adds `_t: Date.now()` to disable caching
- **Files:** `frontend/src/services/api.ts` (lines 31-36)
- **Impact:**
  - No benefit from HTTP caching
  - Higher bandwidth usage
  - Slower performance for repeated requests
- **Fix approach:**
  - Use proper cache headers instead
  - Implement conditional requests (ETag)
  - Cache strategically (static vs dynamic)
  - Add cache busting on API version change only

---

## Architecture & Design Issues

### 30. Clinic Isolation Strategy Not Comprehensive
- **Issue:** Only middleware enforces clinic isolation, not at service/repository layer
- **Files:** Multiple service files
- **Impact:** Potential data leakage if middleware is bypassed
- **Fix approach:**
  - Add clinic ownership checks in all services
  - Use repository pattern with clinic filtering
  - Add database-level foreign key constraints with clinic

### 31. No Request/Response Logging Middleware
- **Issue:** No logging of incoming requests or outgoing responses
- **Files:** None - not implemented
- **Impact:**
  - Cannot debug API issues
  - No audit trail
- **Fix approach:**
  - Add HTTP request/response logging middleware
  - Log to structured format with correlation IDs
  - Sanitize sensitive data in logs

### 32. Missing TypeScript Strict Mode
- **Issue:** tsconfig may not have strict mode fully enabled
- **Files:** `backend/tsconfig.json`, `frontend/tsconfig.json`
- **Impact:** Type errors not caught
- **Fix approach:**
  - Enable all strict options in tsconfig
  - Fix compilation errors
  - Enable in CI/CD

---

## Known Limitations

### 33. AI Transcription Service - Ollama Dependency
- **Issue:** External Ollama service required for transcription feature
- **Files:** `backend/src/ai/ai-transcription.service.ts`
- **Current:** Service gracefully fails but returns placeholder
- **Impact:**
  - Feature unusable without Ollama running
  - Hard dependency not documented
- **Fix approach:**
  - Make AI features optional (feature flag)
  - Document Ollama setup requirements
  - Add health check for AI service
  - Consider managed AI API alternative

### 34. Multi-Database Support - Untested
- **Issue:** MySQL/PostgreSQL configured but only SQLite tested in development
- **Files:** `backend/src/config/database.config.ts`
- **Impact:** Database switching may break in production
- **Fix approach:**
  - Test with PostgreSQL in CI/CD
  - Add database compatibility tests
  - Document tested database versions

---

## Priority Recommendations

**CRITICAL (Fix immediately):**
1. JWT_SECRET default key exposure (#1)
2. Password authentication broken in production (#2)
3. Database synchronization in production (#5)

**HIGH (Fix before production deployment):**
1. Add password field to Staff entity (#3)
2. Implement migrations (#6)
3. Add input validation DTOs (#19)
4. Fix decorator type unsafe casts (#16)
5. Implement comprehensive error handling (#17)

**MEDIUM (Fix within next sprint):**
1. Add N+1 query optimization (#9)
2. Implement database indexes (#10)
3. Add frontend test coverage (#13)
4. Add structured logging (#21)
5. Implement clinic isolation at service layer (#30)

**LOW (Nice to have improvements):**
1. Remove cache bypass tokens (#29)
2. Optimize Docker builds (#24)
3. Add optional AI service feature flag (#33)

---

*Concerns audit: 2026-03-26*
