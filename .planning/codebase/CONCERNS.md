# Codebase Concerns

**Analysis Date:** 2025-02-12

## Tech Debt

**Large UI Components:**
- Issue: `RevenueView.vue` is extremely large (over 1300 lines), combining multiple complex features like revenue rules, records, and adjustments into a single file.
- Files: `frontend/src/views/RevenueView.vue`
- Impact: High maintenance cost, difficult to test, slow IDE performance, and increased risk of regressions when modifying any single feature.
- Fix approach: Extract sub-components for rules, records, and adjustment tables/modals. Use a composable for revenue-related logic.

**Unimplemented Features (TODOs):**
- Issue: Multiple critical UI paths are still unimplemented or use placeholder logic.
- Files: `frontend/src/views/RevenueView.vue`, `frontend/src/views/StaffView.vue`, `frontend/src/views/LoginView.vue`, `frontend/src/components/AppHeader.vue`
- Impact: Users cannot view split records, employee details, or access profile/settings pages.
- Fix approach: Prioritize and implement the missing logic, replacing placeholders with actual API integrations.

**Monolithic Service Methods:**
- Issue: Methods like `createCourse` handle too many responsibilities (validation, template logic, transactions, points redemption, event emission).
- Files: `backend/src/treatments/services/treatment-course.service.ts`
- Impact: Difficult to unit test in isolation, high cognitive load for developers, and potential for side effects.
- Fix approach: Move calculation logic to a domain service or factory. Ensure external service calls like point redemption are properly integrated into the lifecycle (see Fragile Areas).

## Security Considerations

**Cross-Tenant Data Leakage Risk:**
- Risk: `ClinicAuthMiddleware` extracts `clinicId` from various sources (Header, Query, Body) but does not verify if the currently authenticated user actually belongs to or has permission for that `clinicId`.
- Files: `backend/src/common/middlewares/clinic-auth.middleware.ts`, `backend/src/auth/guards/jwt-auth.guard.ts`
- Current mitigation: Basic format validation of `clinicId`.
- Recommendations: Implement a guard or interceptor that verifies the `user.clinicId` (from JWT) matches the `req.clinicId` injected by the middleware.

**Synchronize in Production Risk:**
- Risk: `synchronize: process.env.NODE_ENV !== 'production'` is used in the database configuration. If `NODE_ENV` is not explicitly set to `production` in a production-like environment (e.g., staging), it could lead to accidental schema changes and data loss.
- Files: `backend/src/config/database.config.ts`
- Current mitigation: Relies on `NODE_ENV` being correctly set.
- Recommendations: Change the logic to be "opt-in" for development (e.g., `synchronize: process.env.DB_SYNCHRONIZE === 'true'`) and strictly use migrations for all other environments.

## Performance Bottlenecks

**Database Scalability:**
- Problem: The default database is SQLite, which is unsuitable for a multi-tenant CRM expected to handle high volumes of patient data, revenue records, and audit logs.
- Files: `backend/src/config/database.config.ts`, `backend/package.json`
- Cause: SQLite's file-locking mechanism for writes can become a bottleneck under concurrent load.
- Improvement path: Enforce the use of PostgreSQL in all non-local development environments.

**Deeply Nested Relations:**
- Problem: Frequent use of nested relations in TypeORM queries can lead to inefficient SQL JOINs or N+1 problems.
- Files: `backend/src/treatments/services/treatment-course.service.ts` (e.g., `relations: ["sessions", "sessions.staffAssignments"]`)
- Cause: Easy-to-use but potentially expensive relational mapping.
- Improvement path: Use `QueryBuilder` for complex queries to optimize selections and JOINs. Implement caching for frequently accessed, rarely changing data like templates.

## Fragile Areas

**ACID Violations in Distributed Logic:**
- Files: `backend/src/treatments/services/treatment-course.service.ts`
- Why fragile: The `createCourse` method performs a database transaction for the course and sessions, but then calls `pointsService.redeemPoints()` *outside* the transaction. If point redemption fails, the database remains in an inconsistent state (course created but points not deducted).
- Safe modification: Include point redemption logic within the same database transaction if possible, or implement a robust rollback/compensation mechanism.
- Test coverage: Current tests might not cover the failure scenario of the post-transaction point redemption.

## Scaling Limits

**Audit Log Growth:**
- Current capacity: Unknown, currently stored in a single table with basic indexes.
- Limit: Performance of queries on `AuditLog` will degrade as the table grows to millions of rows.
- Scaling path: Implement log rotation, archiving to a separate storage (e.g., S3), or use a specialized logging/audit service.

## Missing Critical Features

**Rate Limiting:**
- Problem: No global or per-endpoint rate limiting detected.
- Blocks: Protection against brute-force attacks or API abuse.
- Files: `backend/src/main.ts` (missing `@nestjs/throttler` or similar).

**Data Validation in Frontend:**
- Problem: While the backend uses `class-validator`, some frontend forms might lack robust validation before submission.
- Files: `frontend/src/views/RevenueView.vue` (complex forms)
- Risk: Poor UX and unnecessary failed API calls.

---

*Concerns audit: 2025-02-12*
