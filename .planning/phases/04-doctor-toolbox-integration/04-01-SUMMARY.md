---
plan: 04-01
phase: 04-doctor-toolbox-integration
title: Webhook Infrastructure & Patient Sync Index
status: complete
date_completed: 2026-03-30
tasks_completed: 4/4
---

# 04-01 Summary: Webhook Infrastructure & Patient Sync Index

## What Was Built

Foundation infrastructure for Doctor Toolbox bidirectional synchronization:

- **SyncPatientIndex Entity** — Tracks mapping between Doctor Toolbox and CRM patients
  - Composite indexes: (clinicId, webhookId) unique for idempotency, (clinicId, idNumber, name) for fast lookups
  - Multi-clinic isolation enforced at schema level
  - 4-state lifecycle tracking: pending → synced | conflict | failed

- **WebhookSignatureGuard** — HMAC-SHA256 request validation
  - Prevents timing attacks via `crypto.timingSafeEqual()`
  - Prevents replay attacks via 5-minute timestamp window
  - Validates x-signature and x-timestamp headers

- **WebhookPayloadDto** — Strict Doctor Toolbox event schema validation
  - Enum validation on action field (patient_created | patient_updated | patient_deleted)
  - Nested patient object validation
  - Fails on unknown fields (strict schema mapping per CONTEXT.md)

- **SyncStatus Enum** — Lifecycle states for sync operations
  - pending, synced, conflict, failed
  - Used by SyncPatientIndex and downstream services

- **DoctorToolboxSyncModule** — NestJS module wiring
  - TypeOrmModule imports for Patient and SyncPatientIndex
  - Integrated into app.module.ts
  - Ready for Wave 2 services

## Files Created

```
backend/src/doctor-toolbox-sync/
├── entities/
│   ├── sync-patient-index.entity.ts
│   └── index.ts
├── dto/
│   └── webhook-payload.dto.ts
├── guards/
│   └── webhook-signature.guard.ts
└── doctor-toolbox-sync.module.ts

backend/src/common/enums/
├── sync-status.enum.ts
└── index.ts

backend/src/app.module.ts (updated)
```

## Key Decisions Honored

✓ Webhook-based push sync architecture (infrastructure ready)
✓ Exact patient matching (idNumber + name) with dedicated index
✓ Doctor CRM as source of truth (index tracks mappings)
✓ Strict schema validation (fails on mismatch)
✓ Multi-clinic isolation (clinicId in all entities and indexes)
✓ No new dependencies (uses Node.js built-in crypto module)

## What Enables Wave 2

Plan 04-02 (Bidirectional Sync Engine) can now:
- Use WebhookSignatureGuard to protect webhook endpoints
- Validate payloads with WebhookPayloadDto
- Store sync state in SyncPatientIndex
- Track sync progress with SyncStatus enum
- Access Patient and SyncPatientIndex via DoctorToolboxSyncModule

## Success Metrics

- ✓ SyncPatientIndex entity compiles and migrates
- ✓ Composite indexes created (verified in schema)
- ✓ WebhookSignatureGuard prevents unauthorized access
- ✓ WebhookPayloadDto validates strict schema
- ✓ SyncStatus enum provides 4-state lifecycle
- ✓ DoctorToolboxSyncModule wired into app.module.ts
- ✓ Zero blocking dependencies for Wave 2

## Notes

- Entity uses OneToOne relationship to Patient (eager loading) — supports merge operations in Wave 2
- Guard uses timingSafeEqual to prevent cryptographic timing attacks
- DTO fails on unknown fields — strict schema mapping prevents silent data loss
- Module exports TypeOrmModule for downstream service injection

---

**Wave 1 Complete**: Foundation infrastructure ready. Proceed to Wave 2 (Bidirectional Sync Engine).
