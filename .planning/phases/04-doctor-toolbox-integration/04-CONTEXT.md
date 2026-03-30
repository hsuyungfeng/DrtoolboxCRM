# Phase 4: Doctor Toolbox 整合 - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement bidirectional synchronization with Doctor Toolbox system.
Enable unified patient management across both systems using identity (idNumber + name) as the unique lookup key.

Scope:
- API design for Doctor Toolbox communication
- Bidirectional real-time sync mechanism (Webhook-based)
- Patient index by idNumber + name
- Data transformation and conflict resolution
- Initial clinic migration (full patient export)

Out of scope:
- UI changes for Doctor Toolbox management
- Doctor Toolbox feature parity
- Advanced scheduling sync

</domain>

<decisions>
## Implementation Decisions

### Sync Mechanism
- **Primary:** Webhook-based push (Doctor Toolbox → Doctor CRM real-time)
- **Failure handling:** Retry with exponential backoff (3-5 attempts) for failed webhooks
- **Initial sync:** Full patient export on first connection (bulk operation when integrating existing clinic)
- **Rationale:** Webhook is real-time and aligns with existing NestJS event-driven architecture. Exponential backoff handles transient failures without requiring a message broker upfront.

### Conflict Resolution Strategy
- **Authoritative system:** Doctor CRM is source of truth for patient changes
- **Editable fields in CRM:** Core identity only (name, idNumber, contact info) — these changes sync back to Toolbox
- **Medical data in CRM:** Treatment history, therapy notes — CRM-only (don't sync back to Toolbox)
- **Duplicate detection:** Auto-merge when same idNumber + name found (latest data wins)
- **Rationale:** CRM becomes the master for contact info to ensure accuracy during therapy; medical data stays local to avoid unnecessary sync complexity.

### Patient Lookup & Indexing
- **Primary lookup:** Exact match (idNumber + exact name) — no fuzzy matching
- **Fallback lookup:** If idNumber missing, use (name + phone) combination
- **Dedicated sync index:** YES — create `sync_patient_index` table with (idNumber, name, toolbox_patient_id, crm_patient_id, last_sync_at, sync_status)
- **Rationale:** Exact matching is strict but clear; dedicated index table enables fast lookups and clear provenance for support/debugging.

### API Contract & Data Mapping
- **Doctor Toolbox → CRM:** Core identity (id, name, idNumber, phone, email)
- **CRM → Doctor Toolbox:** Core identity only (name, idNumber, phone, email)
- **Schema mismatch handling:** Strict mapping — fail the sync if unmapped fields appear (prevents silent data loss)
- **Rationale:** Minimal sync surface reduces complexity and risk of corruption. Strict mapping makes bugs visible rather than silently dropping data.

### Claude's Discretion
- Exact retry backoff formula (e.g., 2s, 4s, 8s, 16s)
- Webhook signature validation method
- Performance optimization for bulk syncs (batching, timeout handling)
- Logging granularity for sync audit trail

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Patient & Contact Data
- `.planning/REQUIREMENTS.md` — PATIENT-01/02/03, INTEGRATION-01/03 define patient identity and lookup requirements
- `.planning/ROADMAP.md` — Phase 4 section lists Doctor Toolbox integration scope and success criteria (sync delay < 5s, data consistency 99.9%)

### Project Architecture
- `.planning/PROJECT.md` — Tech stack (NestJS, TypeORM, Event Emitter), multi-clinic isolation, existing Patient and Staff entities

### Existing Patient & Contact Models
- `backend/src/patients/entities/patient.entity.ts` — Current patient schema (idNumber, name, phone, email, clinicId)
- `backend/src/staff/entities/staff.entity.ts` — Staff model for reference on multi-clinic patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **NestJS Event Emitter:** System already uses `EventEmitter2` for treatment lifecycle events — webhook handler can plug into same pattern
- **Patient Entity:** `patient.entity.ts` has idNumber + name + contact fields; sync can reuse this structure
- **Multi-clinic isolation:** Existing `clinicId` pattern throughout codebase ensures Toolbox sync respects clinic boundaries

### Established Patterns
- **Error handling:** `BusinessRuleException`, `ValidationException` in place for domain errors
- **Service layer:** `PatientService` handles patient CRUD; sync logic can layer on top
- **Testing:** Jest + database fixtures already established for transactional tests

### Integration Points
- Webhook endpoint: Create new controller in `doctor-toolbox-sync/` module
- Event subscription: Hook into Patient lifecycle events to trigger outbound sync
- Database: Add `sync_patient_index` table; Patient entity may need `syncStatus` field for tracking

</code_context>

<specifics>
## Specific Ideas

- Sync index should track `syncStatus` ('pending', 'synced', 'conflict', 'failed') for visibility
- Webhook secret validation using HMAC for security
- Audit log every sync event (which patient, which fields, source system, timestamp)
- Consider eventual consistency model: sync completes async, client sees optimistic update

</specifics>

<deferred>
## Deferred Ideas

- Scheduled bulk sync job (nightly reconciliation) — could be Phase 4b if initial sync has gaps
- Toolbox-to-CRM treatment/therapy data sync — Phase 5 if needed
- Doctor Toolbox UI within Doctor CRM — separate phase
- Advanced conflict resolution (field-level rules, merge strategies) — Phase 5 if conflicts become common

</deferred>

---

*Phase: 04-doctor-toolbox-integration*
*Context gathered: 2026-03-30*
