# 外部集成 (External Integrations)

**分析日期 (Analysis Date):** 2026-03-26

## API 與外部服務 (APIs & External Services)

**AI 和機器學習:**
- Ollama (本地 LLM 伺服器)
  - 用途: 醫療筆記轉錄、治療計畫生成、效果分析
  - SDK/客戶端: 原生 Fetch API (Node.js built-in)
  - 認證: 無（本地服務）
  - 環境變數: `OLLAMA_URL`, `OLLAMA_MODEL`, `OLLAMA_MAX_TOKENS`, `OLLAMA_TEMPERATURE`
  - 配置位置: `backend/src/ai/ai-transcription.service.ts`
  - 預設模型: llama3.2
  - API 端點: `/api/generate`, `/api/tags`

**資料分析和預測:**
- 流失預測服務 (內部)
  - 位置: `backend/src/notifications/churn-prediction.service.ts`
  - 用途: 分析患者流失風險
  - 不依賴外部服務

## 資料儲存 (Data Storage)

**資料庫:**
- SQLite 5.1.7
  - 連接: 本地檔案型資料庫 (`./database.sqlite`)
  - 用途: 開發和小規模部署
  - 客戶端: TypeORM ORM
  - 配置檔案: `backend/src/config/database.config.ts`
  - 環境變數: `DATABASE_PATH`

- PostgreSQL (生產環境推薦)
  - 連接: TCP 連接 (host, port, username, password)
  - 用途: 生產環境資料庫
  - 客戶端: TypeORM ORM
  - 配置檔案: `backend/src/config/postgres.config.ts`
  - 環境變數: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `DB_SSL`
  - 預設埠: 5432
  - SSL 支援: 可選 (`DB_SSL=true`)
  - 遷移工具: TypeORM 遷移

**資料庫實體 (TypeORM Entities):**
位置: `backend/src/config/database.config.ts`
- Staff (員工)
- Patient (患者)
- Treatment (療程)
- TreatmentSession (療程會話)
- TreatmentCourse (療程課程)
- TreatmentTemplate (療程範本)
- TreatmentCourseTemplate (療程課程範本)
- StaffAssignment (員工分配)
- TreatmentStaffAssignment (療程員工分配)
- RevenueRecord (收入記錄)
- RevenueRule (收入規則)
- RevenueAdjustment (收入調整)
- PointsConfig (點數組態)
- PointsBalance (點數餘額)
- PointsTransaction (點數交易)
- AuditLog (審計日誌)

**檔案儲存:**
- 本地檔案系統只 (No external cloud storage)
- SQLite 資料庫檔案: `/app/data/database.sqlite`（Docker）
- Docker 卷: `./backend/data:/app/data`

**快取:**
- 無外部快取服務 (Not detected)
- 應用程式層級快取: 內存中（如果實現）

## 認證和身份驗證 (Authentication & Identity)

**認證提供者:**
- 自訂 JWT 實現（非外部提供者）
  - 實現位置: `backend/src/auth/`
  - 策略: JWT Bearer 令牌
  - 使用 bcrypt 進行密碼雜湊

**認證流程:**
1. 使用者登入端點: `POST /api/login`
2. 密碼驗證: bcrypt.compare()
3. JWT 令牌生成: 簽署 JWT 有效期 7 天
4. 路由保護: JwtAuthGuard (`backend/src/auth/guards/jwt-auth.guard`)
5. 診所隔離: ClinicAuthMiddleware (`backend/src/common/middlewares/clinic-auth.middleware.ts`)

**環境變數:**
- `JWT_SECRET` - 簽署祕密（必須在生產環境中更改）
- `JWT_EXPIRES_IN` - 過期時間（預設: 7d）

**相關檔案:**
- `backend/src/auth/auth.service.ts` - 認證邏輯
- `backend/src/auth/strategies/jwt.strategy` - JWT 策略
- `backend/src/auth/guards/jwt-auth.guard` - 認證防衛
- `backend/src/staff/services/staff.service.ts` - 使用者查詢

## 監控和可觀測性 (Monitoring & Observability)

**錯誤追蹤:**
- 無外部服務 (Not detected)
- 應用程式級別錯誤過濾器已實現:
  - `backend/src/common/filters/http-exception.filter.ts` - HTTP 異常處理
  - `backend/src/common/filters/all-exceptions.filter.ts` - 全域異常處理

**日誌:**
- 內置 NestJS Logger
- 日誌級別: 環境變數 `LOG_LEVEL`（預設: debug）
- 資料庫查詢日誌: 開發環境啟用（`database.config.ts` 中的 logging 設定）

**審計日誌:**
- 內部審計日誌實現
- 位置: `backend/src/common/audit/audit-log.service.ts`
- 資料庫實體: AuditLog
- 模組: `backend/src/common/audit/` (AuditModule)

## CI/CD 和部署 (CI/CD & Deployment)

**託管:**
- Docker Compose (開發和生產)
- Nginx (前端靜態伺服)
- Node.js (後端應用伺服)
- 容器協調: Docker Compose 3.8

**CI 流程:**
- 發現: `.github/workflows/ci-cd.yml` (已建立但未提交的修改)
- 工具: GitHub Actions (推斷)
- 未詳細配置

**部署組態:**
檔案: `docker-compose.yml` (開發) 和 `docker-compose.prod.yml` (生產)
- 後端服務:
  - 埠: 3000
  - 環境: NODE_ENV, DATABASE_PATH, JWT_SECRET
  - 健康檢查: GET /api (30s 間隔)
  - 卷: ./backend/data (資料庫儲存)

- 前端服務:
  - 埠: 80 (HTTP), 443 (HTTPS)
  - 環境: VITE_API_BASE_URL
  - 依賴: 後端服務健康檢查

- 網路: crm-network (橋接網路)
- 重啟策略: unless-stopped

**Docker 映像:**
- 後端: `node:18-alpine` (多階段構建)
  - 構建階段: npm ci + npm run build
  - 執行階段: 構建輸出 + node_modules
  - 入口: npm run start:prod

- 前端: `node:18-alpine` (構建) + `nginx:alpine` (執行)
  - 構建階段: npm ci + npm run build (Vite)
  - 執行階段: Nginx 提供 dist 檔案
  - EXPOSE: 80

## 環境組態 (Environment Configuration)

**必要環境變數:**

*應用程式:*
- `NODE_ENV` - 應用程式環境 (development/production)
- `PORT` - 伺服器埠 (預設: 3000)

*資料庫:*
- `DB_TYPE` - 資料庫類型 (sqlite/postgres，預設: sqlite)
- `DATABASE_PATH` - SQLite 檔案路徑 (預設: ./database.sqlite)
- `DB_HOST` - 資料庫主機名稱
- `DB_PORT` - 資料庫埠
- `DB_USERNAME` - 資料庫使用者名稱
- `DB_PASSWORD` - 資料庫密碼
- `DB_DATABASE` - 資料庫名稱
- `DB_SSL` - SSL 啟用標誌 (postgres)

*認證:*
- `JWT_SECRET` - JWT 簽署祕密 (**必須更改**)
- `JWT_EXPIRES_IN` - 令牌過期時間 (預設: 7d)

*CORS:*
- `CORS_ORIGIN` - 允許的來源 (預設: true 允許全部)

*AI:*
- `OLLAMA_URL` - Ollama 伺服器 URL (預設: http://localhost:11434)
- `OLLAMA_MODEL` - 模型名稱 (預設: llama3.2)
- `OLLAMA_MAX_TOKENS` - 最大令牌數 (預設: 2000)
- `OLLAMA_TEMPERATURE` - 溫度參數 (預設: 0.3)
- `OLLAMA_TOP_P` - Top P 參數 (預設: 0.9)

*前端:*
- `VITE_API_BASE_URL` - 後端 API 基底 URL (預設: http://localhost:3000/api)

**祕密位置:**
- 不在版本控制中
- `.env` 檔案（開發，未提交）
- Docker 環境變數或祕密管理系統（生產）

## Webhook 和回呼 (Webhooks & Callbacks)

**傳入 Webhook:**
- 無外部 Webhook 端點 (Not detected)

**傳出 Webhook:**
- 無傳出 Webhook (Not detected)

**事件驅動架構:**
- NestJS EventEmitter 模組啟用 (app.module.ts)
- 內部事件發布/訂閱機制
- 位置: `backend/src/events/`（如果存在）
- 審計事件: 變更日誌追蹤

## API 端點概述 (API Endpoints Overview)

**主要路由組:**
- `/api/auth` - 認證
- `/api/patients` - 患者管理
- `/api/treatments` - 療程管理
- `/api/staff` - 員工管理
- `/api/revenue` - 分潤管理
- `/api/points` - 點數系統
- `/api/referrals` - 推薦管理
- `/api/treatment-templates` - 療程範本
- `/api/ai` - AI 轉錄和分析
- `/api/notifications` - 通知
- `/api/docs` - Swagger API 文檔
- `/api/health` - 健康檢查

**認證:**
- 所有受保護端點需要: `Authorization: Bearer <JWT_TOKEN>`
- 公開端點: `/api/health`, `/api/docs`, `/api/login`

---

*集成審計 (Integration audit): 2026-03-26*
