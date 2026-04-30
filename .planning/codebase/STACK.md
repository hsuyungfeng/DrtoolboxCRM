# Technology Stack

**Analysis Date:** 2025-02-14

## Languages

**Primary:**
- TypeScript 5.7+ - Backend and Frontend core logic.

**Secondary:**
- JavaScript (ES Modules) - Configuration files (Vite, ESLint).

## Runtime

**Environment:**
- Node.js 22.x - Recommended runtime (based on `@types/node`).

**Package Manager:**
- npm - Standard package manager.
- Lockfile: `package-lock.json` present in both `backend/` and `frontend/`.

## Frameworks

**Core:**
- NestJS 11 - Backend framework (Node.js).
- Vue 3.5 - Frontend framework.

**Testing:**
- Jest 30 - Backend unit and integration testing.
- Vitest 4 - Frontend unit testing.
- Playwright 1.58 - End-to-end testing.

**Build/Dev:**
- Vite 6 - Frontend build tool and dev server.
- Nest CLI - Backend build and scaffolding.

## Key Dependencies

**Critical:**
- TypeORM 0.3 - Object-Relational Mapping for database access.
- Naive UI 2.43 - Frontend UI component library.
- Pinia 3.0 - Frontend state management.
- Passport/JWT - Authentication middleware.

**Infrastructure:**
- SQLite3 - Default development database.
- Axios - Frontend HTTP client.
- ECharts / Vue-ECharts - Data visualization and dashboard charts.
- RxJS - Reactive programming library (used by NestJS).

## Configuration

**Environment:**
- Configured via `.env` files (see `.env.example`).
- `VITE_API_BASE_URL` for frontend-backend connection.

**Build:**
- `backend/tsconfig.json`
- `frontend/tsconfig.json`, `frontend/vite.config.ts`
- `nest-cli.json`

## Platform Requirements

**Development:**
- Docker and Docker Compose (for containerized environment).
- Node.js 22.x.

**Production:**
- Deployment target: Docker container (supports MySQL/PostgreSQL).

---

*Stack analysis: 2025-02-14*
