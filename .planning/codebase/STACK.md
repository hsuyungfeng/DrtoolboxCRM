# 技術棧 (Technology Stack)

**分析日期 (Analysis Date):** 2026-03-26

## 程式語言 (Languages)

**主要:**
- TypeScript 5.7.3 - 後端 (NestJS) 和前端 (Vue 3) 應用程式碼
- JavaScript - 構建工具和工具鏈

**輔助:**
- CSS/SCSS - 前端樣式（via Naive UI）
- SQL - 資料庫操作（SQLite, PostgreSQL）

## 運行環境 (Runtime)

**環境:**
- Node.js 18-alpine (Docker 映像中指定)
  - 開發環境: Node.js 18+

**套件管理器:**
- npm (v9+)
- Lockfile: `package-lock.json` (lockfileVersion 3)

## 框架和庫 (Frameworks & Core Libraries)

**後端核心 (`backend/`):**
- NestJS 11.0.1 - 企業級伺服器框架
  - @nestjs/core 11.0.1
  - @nestjs/common 11.0.1
  - @nestjs/platform-express 11.0.1
  - @nestjs/swagger 11.2.6 - API 文檔生成
  - @nestjs/typeorm 11.0.0 - ORM 集成
  - @nestjs/event-emitter 3.0.1 - 事件驅動架構
  - @nestjs/jwt 11.0.2 - JWT 認證
  - @nestjs/passport 11.0.5 - 認證策略
  - @nestjs/testing 11.0.1 - 單元和集成測試

**前端核心 (`frontend/`):**
- Vue 3.5.25 - 漸進式前端框架
- Vite 7.3.1 - 構建工具和開發伺服器
- Vue Router 4.0.0 - 路由管理
- Pinia 3.0.4 - 狀態管理 (Vue store)
- Naive UI 2.43.2 - UI 元件庫
- ECharts 6.0.0 - 資料視覺化圖表
- Vue-ECharts 8.0.1 - Vue 中的 ECharts 包裝器
- Vue-i18n 9.14.5 - 國際化 (i18n) 支援
- Axios 1.13.5 - HTTP 客戶端

## 關鍵依賴 (Key Dependencies)

**資料庫和 ORM:**
- TypeORM 0.3.28 - 資料庫 ORM，支援 SQLite 和 PostgreSQL
- sqlite3 5.1.7 - SQLite 驅動程式（開發/小規模部署）
- postgres (隱含 via TypeORM) - PostgreSQL 驅動程式（生產環境）

**認證和安全:**
- bcrypt 6.0.0 - 密碼雜湊
- passport 0.7.0 - 認證中間件框架
- passport-jwt 4.0.1 - JWT 認證策略
- @types/passport-jwt 4.0.1 - JWT 類型定義

**資料驗證和轉換:**
- class-validator 0.14.3 - 類別型驗證器（DTO 驗證）
- class-transformer 0.5.1 - 物件轉換和序列化
- decimal.js 10.6.0 - 高精度數字計算（用於金融計算）

**工具和工具鏈:**
- RxJS 7.8.1 - 反應式編程庫
- reflect-metadata 0.2.2 - Metadata 反射（NestJS 依賴項）
- swagger-ui-express 5.0.1 - Swagger UI 伺服器
- vfonts 0.0.3 - 前端字體包

**開發工具:**
- TypeScript 5.7.3 - 類型檢查和編譯
- ts-jest 29.2.5 - Jest 的 TypeScript 轉換器
- ts-loader 9.5.2 - Webpack 的 TypeScript 載入器
- ts-node 10.9.2 - 執行 TypeScript 文件
- tsconfig-paths 4.2.0 - 路徑別名解析
- jest 30.0.0 - 後端單元測試框架
- @nestjs/schematics 11.0.0 - NestJS CLI 架構
- @nestjs/cli 11.0.0 - NestJS 命令列工具

**代碼品質:**
- ESLint 9.18.0 - JavaScript/TypeScript linter
- Prettier 3.4.2 - 代碼格式化工具
- eslint-config-prettier 10.0.1 - ESLint ↔ Prettier 互操作性
- eslint-plugin-prettier 5.2.2 - 執行 Prettier 為 ESLint 規則
- typescript-eslint 8.20.0 - TypeScript linting

**前端測試:**
- @playwright/test 1.58.2 - E2E 測試框架（前端）

**超級測試:**
- supertest 7.0.0 - HTTP 斷言庫
- @types/jest 30.0.0 - Jest 類型定義
- @types/supertest 6.0.2 - Supertest 類型定義
- @types/express 5.0.0 - Express 類型定義

**工具鏈:**
- source-map-support 0.5.21 - 生產環境中的堆棧跟蹤支援

## 組態 (Configuration)

**環境組態:**
- 使用環境變數進行組態管理
- 支援多個環境: `development`, `production`
- 組態檔案: `.env.example` (開發), `.env.production.example` (生產)

**關鍵環境變數:**
- `NODE_ENV` - 應用程式環境
- `PORT` - 伺服器埠（預設 3000）
- `DATABASE_PATH` - SQLite 資料庫路徑
- `DB_TYPE`, `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` - 資料庫組態
- `JWT_SECRET` - JWT 簽署祕密
- `JWT_EXPIRES_IN` - JWT 過期時間
- `CORS_ORIGIN` - CORS 原點 (前端 URL)
- `OLLAMA_URL`, `OLLAMA_MODEL`, `OLLAMA_MAX_TOKENS`, `OLLAMA_TEMPERATURE` - AI 轉錄服務組態
- `VITE_API_BASE_URL` - 前端 API 基底 URL
- `LOG_LEVEL` - 日誌級別

**TypeScript 組態:**
- `backend/tsconfig.json` - 後端 TypeScript 設定
  - Target: ES2023
  - Module: nodenext
  - 嚴格模式啟用
  - 裝飾器支援啟用
- `frontend/tsconfig.json` - 前端 TypeScript 設定（參考結構）

**構建組態:**
- `frontend/vite.config.ts` - Vite 構建組態
  - 包含代碼分割優化：echarts, naive-ui, vue-vendor
  - 別名: `@` -> `./src`
  - Chunk 大小警告限制: 600KB

**Jest 組態 (後端):**
```
- rootDir: src
- testRegex: .*\.spec\.ts$
- transform: ts-jest for TypeScript files
- collectCoverageFrom: **/*.(t|j)s
- testEnvironment: node
```

## 部署和平台要求 (Platform Requirements)

**開發:**
- Node.js 18+
- npm 9+
- Git (版本控制)
- Docker (可選，用於容器化開發)

**生產:**
- Node.js 18-alpine (Docker)
- Nginx (前端 SPA 伺服）
- PostgreSQL 12+ (建議用於生產環境資料庫)
- SQLite (支援但不建議用於生產)

**Docker 映像:**
- 後端: `node:18-alpine` (多階段構建)
- 前端: `nginx:alpine` (靜態檔案伺服)
- 組合部署: docker-compose.yml (開發) 和 docker-compose.prod.yml (生產)

**資料庫支援:**
- 開發: SQLite (檔案型資料庫，無需外部設定)
- 生產: PostgreSQL (TCP 連接，支援 SSL)

---

*技術棧分析 (Stack analysis): 2026-03-26*
