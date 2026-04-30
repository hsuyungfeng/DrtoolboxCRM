# Phase 05: System Refinement and Advanced Features - Research

**Researched:** 2026-04-27
**Domain:** CRM Modularization, Multi-tenancy, Dynamic Attributes, Data Synchronization
**Confidence:** HIGH

## Summary

This phase focuses on transitioning the system from a rapid prototype to a production-ready CRM. Key areas include refactoring the oversized `RevenueView.vue` into a modular architecture, implementing a flexible "Dynamic Attributes" system to allow clinics to customize data fields without schema changes, strengthening multi-tenant isolation via a global `ClinicGuard`, and enabling outbound synchronization to the Doctor Toolbox.

**Primary recommendation:** Use PostgreSQL **JSONB** for dynamic attributes to balance flexibility and performance, and adopt an **Event-Driven Architecture** for the outbound sync to ensure non-blocking operations.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostgreSQL | 16+ | Primary Database | Required for JSONB support and high concurrency. |
| NestJS EventEmitter2 | ^3.0.0 | Event Handling | Standard for decoupled internal communication. |
| TypeORM | ^0.3.0 | ORM | Current project standard, supports JSONB natively. |
| Naive UI | ^2.43.2 | Frontend Components | Project standard, used for modularizing Revenue view. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| @nestjs/throttler | ^5.0.0 | Rate Limiting | Protect API endpoints from abuse. |
| Vue-ECharts | ^8.0.0 | Data Visualization | Used in `RevenueDashboard.vue` for modular stats. |

## Architecture Patterns

### Recommended Project Structure (Revenue Refactor)
```
frontend/src/views/Revenue/
├── RevenueView.vue           # Main entry (Tab container)
├── components/
│   ├── RevenueDashboard.vue  # Stats and Charts
│   ├── RevenueRecordsTable.vue# Data table for records
│   ├── RevenueRulesTable.vue  # Data table for rules
│   ├── RevenueAdjustmentTable.vue # Data table for adjustments
│   ├── RevenueRuleModal.vue   # Create/Edit Rule form
│   └── RevenueCalculator.vue # Trial calculation tool
└── services/
    └── revenue.logic.ts      # Shared business logic (if any)
```

### Pattern 1: Dynamic Attributes (JSONB + Metadata)
**What:** Store custom values in a `customFields` JSONB column while maintaining field definitions in a separate table.
**When to use:** When users need to add fields (e.g., "Allergies", "Referred By") dynamically.
**Implementation:**
1.  **AttributeDefinition Entity**: Stores `name`, `type` (text, number, date, select), `options`, `clinicId`.
2.  **Entity Integration**: Add `customFields: Record<string, any>` to `Patient` or `Treatment` entities.

### Pattern 2: ClinicGuard (Multi-tenant Security)
**What:** A global guard that enforces `clinicId` matching between the request and the authenticated user.
**Mechanism:**
- `@ClinicScoped()`: Controller/Method decorator to enable isolation check.
- `ClinicGuard`: Validates `req.headers['x-clinic-id'] === req.user.clinicId`.
- `@Clinic()`: Parameter decorator to inject current clinic context.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Custom Field Validation | Manual JSON parsing | `class-validator` + DTO | Standard, declarative, and secure. |
| Data Sync Retries | Custom loop/timer | `RetryService` (existing) | Avoid duplicate logic, use established backoff patterns. |
| Charting | SVG/Canvas from scratch | `Vue-ECharts` | Handles responsiveness and complex interactions. |

## Common Pitfalls

### Pitfall 1: JSONB Performance
**What goes wrong:** Slow queries when filtering by deep JSON keys.
**How to avoid:** Use **GIN Indexes** on the JSONB column for frequently queried fields.
```sql
CREATE INDEX idx_patient_custom_fields ON patients USING GIN (customFields);
```

### Pitfall 2: Sync Race Conditions
**What goes wrong:** CRM and Toolbox update the same record simultaneously, leading to data loss.
**How to avoid:** Use `updatedAt` timestamps and a "Last-Writer-Wins" or "CRM-Authority" policy.
**Warning signs:** Sync audit logs showing frequent conflicts or overwrites.

## Code Examples

### JSONB Query with TypeORM
```typescript
// Source: https://orkhan.gitbook.io/typeorm/docs/select-query-builder
const patients = await repository.createQueryBuilder('patient')
  .where("patient.customFields ->> 'bloodType' = :type", { type: 'O+' })
  .getMany();
```

### Clinic Decorator
```typescript
// Source: NestJS Official Docs (Custom Decorators)
export const Clinic = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.clinicId;
  },
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| EAV Pattern | JSONB Column | PostgreSQL 9.4+ | Faster queries, simpler schema, less JOIN overhead. |
| Middleware-only Isolation| Guard + Decorator | NestJS Standard | Explicit, type-safe, and easier to test. |

## Open Questions

1. **How to handle large file uploads in custom fields?**
   - Recommendation: Store only the S3/OSS URL in JSONB, handle upload via a separate service.
2. **What happens if an Attribute Definition is deleted?**
   - Recommendation: Use soft-delete for definitions or prevent deletion if values exist.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (Backend) / Vitest & Playwright (Frontend) |
| Config file | backend/package.json, frontend/vitest.config.ts |
| Quick run command | `npm test` (Backend), `npm run test:unit` (Frontend) |
| Full suite command | `npm run test:e2e` |
| Estimated runtime | ~60-120 seconds |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REF-01 | Revenue modular UI integrity | unit | `vitest frontend/src/views/Revenue/` | ❌ Wave 0 gap |
| DYN-01 | Custom fields CRUD and indexing | integration | `jest backend/src/patients/` | ❌ Wave 0 gap |
| SEC-01 | Clinic isolation enforcement | e2e | `jest backend/test/clinic-guard.e2e-spec.ts` | ❌ Wave 0 gap |
| SYNC-01| Outbound sync event trigger | integration | `jest backend/src/doctor-toolbox-sync/` | ❌ Wave 0 gap |

### Nyquist Sampling Rate
- **Minimum sample interval:** After every task commit.
- **Full suite trigger:** Before merging Wave 0 or any major feature wave.
- **Phase-complete gate:** All tests green (Unit + E2E).

### Wave 0 Gaps
- [ ] `backend/test/clinic-guard.e2e-spec.ts` — Cross-tenant security verification.
- [ ] `backend/src/common/attributes/` — New module for attribute definitions.
- [ ] `frontend/src/views/Revenue/components/` — Modular components skeleton.

## Sources

### Primary (HIGH confidence)
- `Crmimprove0427.md` - Strategic context and refactoring goals.
- PostgreSQL Official Docs - JSONB features and performance.
- NestJS Official Docs - Guards and Custom Decorators.

### Secondary (MEDIUM confidence)
- TypeORM JSONB Support - Verified via community patterns.
- Krayin CRM Architecture - Reference for EAV/Custom field design.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Based on existing project tech.
- Architecture: HIGH - Follows industry best practices for NestJS/PostgreSQL.
- Pitfalls: MEDIUM - Depends on actual data volume in production.

**Research date:** 2026-04-27
**Valid until:** 2026-05-27
