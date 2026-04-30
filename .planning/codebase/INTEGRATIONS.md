# External Integrations

**Analysis Date:** 2025-02-14

## APIs & External Services

**Doctor Toolbox Sync:**
- Bidirectional patient data synchronization.
  - SDK/Client: REST API (using standard `fetch` with retry logic).
  - Sync Services: `backend/src/doctor-toolbox-sync/services/sync-patient.service.ts`, `backend/src/doctor-toolbox-sync/services/bulk-export.service.ts`.
  - Auth: API Key (`DOCTOR_TOOLBOX_API_KEY`) and Webhook signature validation (`WebhookSignatureGuard`).
  - Configuration: `DOCTOR_TOOLBOX_API_URL`, `DOCTOR_TOOLBOX_WEBHOOK_URL`.

## Data Storage

**Databases:**
- SQLite (Development)
  - Connection: `DATABASE_PATH` (env var)
  - Client: TypeORM
- MySQL/PostgreSQL (Production ready)
  - Connection: `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`.

**File Storage:**
- Local filesystem (implicit for SQLite).

**Caching:**
- None (currently using in-memory stubs or direct DB access).

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based authentication.
  - Implementation: Passport JWT Strategy in `backend/src/auth/strategies/jwt.strategy.ts`.
  - Token handling: `@nestjs/jwt`.

## Monitoring & Observability

**Error Tracking:**
- None (Internal NestJS Logger only).

**Logs:**
- Standard NestJS Logger (outputs to console/stdout).
- `LOG_LEVEL` environment variable.

## CI/CD & Deployment

**Hosting:**
- Docker-based deployment.
- `docker-compose.yml` for local/production stack.

**CI Pipeline:**
- GitHub Actions: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`.

## Environment Configuration

**Required env vars:**
- `DATABASE_PATH`: Path to SQLite file.
- `JWT_SECRET`: Secret for JWT signing.
- `VITE_API_BASE_URL`: API endpoint for frontend.
- `DOCTOR_TOOLBOX_API_KEY`: API key for external sync.

**Secrets location:**
- `.env` files (not committed).
- `.env.example` provides the template.

## Webhooks & Callbacks

**Incoming:**
- `POST /api/doctor-toolbox-sync/webhook`: Receives patient updates from Doctor Toolbox.
- Security: Protected by `WebhookSignatureGuard`.

**Outgoing:**
- Push to Doctor Toolbox: Triggered by patient updates in CRM.
- Location: `SyncPatientService.pushPatientToToolbox`.

---

*Integration audit: 2025-02-14*
