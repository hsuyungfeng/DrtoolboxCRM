# 下一步技術任務清單 (v2.0)

> **重新規劃日期**：2026-04-19
> **專案狀態**：v1.0 里程碑已達成（2026-03-31），4 Phase 全部完成
> **生產就緒度**：71%（可部署，但需強化安全、監控、效能）
> **本清單來源**：後端/前端/DevOps 三方向深度研究

---

## 🔴 P0 生產阻塞項（部署前必修）

### 1. 認證系統安全修復
**嚴重度**：🔴 嚴重｜**預估**：2 人日

**問題**：
- `src/auth/strategies/jwt.strategy.ts:21` — JWT secret 硬編碼為 `"your-super-secret-key-change-in-production"`
- `src/auth/auth.service.ts:78-86` — 開發環境允許 `password123` 登入，生產環境直接 `return false`
- `src/staff/entities/staff.entity.ts` — 無 `password` / `username` 欄位，無密碼雜湊機制

**行動項**：
- [ ] 移除硬編碼 secret，強制讀取 `process.env.JWT_SECRET`，啟動時驗證存在性
- [ ] Staff entity 新增 `username`（唯一索引）、`passwordHash`（bcrypt）欄位
- [ ] 建立 TypeORM migration 遷移現有 Staff 資料
- [ ] 實作 `AuthService.validateUser()` 使用 `bcrypt.compare()` 比對雜湊
- [ ] 提供 `seed-data.ts` 建立初始 admin 帳號（bcrypt 雜湊 password）

**驗證**：
- 啟動服務：若 `JWT_SECRET` 未設則拋錯退出
- 登入 API：以錯誤密碼返回 401，正確密碼返回 JWT token
- 測試：`src/auth/auth.service.spec.ts` 新增雜湊驗證案例

---

### 2. 前端登入整合後端 JWT
**嚴重度**：🔴 嚴重｜**預估**：1 人日

**問題**：`frontend/src/views/LoginView.vue` 使用模擬登入，未呼叫實際 API

**行動項**：
- [ ] 建立 `frontend/src/services/auth.service.ts`：封裝 `POST /auth/login`
- [ ] `LoginView.vue` 移除模擬邏輯，改呼叫 authService
- [ ] 登入成功寫入 `useUserStore`（token、user、clinicId）
- [ ] 錯誤狀態顯示：401/422 錯誤訊息本地化（zh-TW/en）

**驗證**：真實帳號登入成功跳轉 `/dashboard`，錯誤帳號顯示錯誤訊息

---

### 3. 前端路由認證守衛
**嚴重度**：🔴 嚴重｜**預估**：0.5 人日

**問題**：`frontend/src/router/index.ts` 無 `beforeEach` 認證守衛，所有路由可直接存取

**行動項**：
- [ ] 新增全域守衛：檢查 `useUserStore.isAuthenticated`
- [ ] 未登入自動跳轉 `/login`，並記錄原始目標 URL
- [ ] 登入後跳轉回原始 URL
- [ ] 路由 meta 新增 `requiresAuth: true` / `roles: ['admin']` 支援

**驗證**：未登入狀態存取 `/patients` 應重導至 `/login`

---

### 4. HTTP 安全強化（Helmet + CORS 嚴格化）
**嚴重度**：🔴 嚴重｜**預估**：0.5 人日

**問題**：`src/main.ts` 缺 Helmet，CORS `origin: true` 允許所有來源

**行動項**：
- [ ] 安裝 `helmet` 並於 `main.ts` 啟用（CSP、X-Frame-Options、HSTS）
- [ ] CORS 改為白名單：`process.env.CORS_ORIGIN.split(',')`
- [ ] `.env.example` 補充：`JWT_SECRET`、`CORS_ORIGIN`、`BCRYPT_ROUNDS`

**驗證**：`curl -I http://localhost:3000/api/health` 確認安全頭存在

---

## 🟡 P1 生產後強化（部署後 1 週內）

### 5. API 速率限制（@nestjs/throttler）
**嚴重度**：🟡 中等｜**預估**：0.5 人日

- [ ] 安裝 `@nestjs/throttler`，於 `AppModule` 全域註冊
- [ ] 預設：`ttl: 60000, limit: 100`（1 分鐘 100 次）
- [ ] Auth 路由加嚴：`login` 每 IP 每 5 分鐘限 10 次
- [ ] 文檔/健康檢查豁免速率限制

---

### 6. 專業日誌系統（Winston + pino-http）
**嚴重度**：🟡 中等｜**預估**：1 人日

**問題**：目前使用 NestJS 內建 Logger，無結構化、無持久化

**行動項**：
- [ ] 選擇 `nestjs-pino`（推薦：輕量、高效能）
- [ ] 設計日誌分層：`request`、`audit`（分潤、認證）、`error`
- [ ] 生產環境輸出 JSON 格式便於 ELK/Loki 採集
- [ ] 敏感欄位自動遮罩：`password`、`token`、`idNumber`

---

### 7. 錯誤追蹤（Sentry）
**嚴重度**：🟡 中等｜**預估**：0.5 人日

- [ ] 後端：`@sentry/node` + `@sentry/nestjs` 整合
- [ ] 前端：`@sentry/vue` 整合，source map 上傳
- [ ] Release 標記：CI 中自動上傳 release version
- [ ] 排除個資：`beforeSend` 過濾 PII

---

### 8. TypeORM Migration 版本化
**嚴重度**：🟡 中等｜**預估**：1 人日

**問題**：`src/migrations/` 僅存根，`synchronize: true` 只適合開發

**行動項**：
- [ ] 建立 TypeORM CLI 配置（`typeorm.config.ts`）
- [ ] 生成初始 migration：`typeorm migration:generate`
- [ ] 生產環境 `synchronize: false`，啟動前跑 `migration:run`
- [ ] CI 加入 migration dry-run 檢查

---

### 9. 分潤計算併發安全
**嚴重度**：🟡 中等｜**預估**：1.5 人日

**問題**：`src/treatments/services/treatment-session.service.ts` 併發完成多個 session 可能重複觸發分潤

**行動項**：
- [ ] `RevenueCalculatorService.calculate()` 使用 `SELECT ... FOR UPDATE` 悲觀鎖
- [ ] 新增 `RevenueRecord` 唯一索引：`(treatmentSessionId, staffId, ruleId)`
- [ ] 重複事件觸發改為 idempotent（查重後跳過）
- [ ] 壓力測試：100 併發 session 完成，驗證分潤記錄無重複

---

### 10. RBAC 角色權限系統
**嚴重度**：🟡 中等｜**預估**：2 人日

**問題**：僅 super_admin 跨診所檢查，無細粒度權限

**行動項**：
- [ ] 建立 `src/common/guards/roles.guard.ts` + `@Roles()` 裝飾器
- [ ] 定義 Permission enum：`MANAGE_STAFF`、`VIEW_REVENUE`、`LOCK_REVENUE`、`APPROVE_ADJUSTMENT`
- [ ] 角色 → 權限映射（admin / doctor / therapist / receptionist / finance）
- [ ] 前端 `useUserStore.hasPermission()` helper，UI 條件渲染按鈕

---

## 🟢 P2 功能擴展（1 個月內）

### 11. 預約排程模組（Scheduling）
**嚴重度**：🟢 功能｜**預估**：5 人日

**說明**：診所 CRM 核心缺口

**行動項**：
- [ ] 後端：`AppointmentModule`（entity、DTO、CRUD、衝突檢查）
- [ ] 前端：日曆視圖（`FullCalendar` 或 `vue-cal`）+ 拖拉調整
- [ ] 自動提醒任務：預約前 24/1 小時觸發通知事件
- [ ] 療程/醫令關聯：預約可綁定 treatment

---

### 12. SMS/Email 通知渠道
**嚴重度**：🟢 功能｜**預估**：2 人日

**說明**：`NotificationsModule` 事件框架已有，缺實際發送渠道

**行動項**：
- [ ] Email：整合 `@nestjs-modules/mailer`（SMTP / SendGrid）
- [ ] SMS：整合 Twilio 或台灣 Mitake 簡訊閘道
- [ ] 範本系統：Handlebars 模板（預約提醒、療程完成、分潤通知）
- [ ] 佇列化：`@nestjs/bullmq` 背景處理避免阻塞

---

### 13. 報表分析儀表板
**嚴重度**：🟢 功能｜**預估**：4 人日

**行動項**：
- [ ] 後端：`ReportsModule` 聚合查詢 API
  - 月度營收 / 分潤 / 新增患者 / 療程完成率
- [ ] 前端：`ReportsView.vue` 使用現有 ECharts
- [ ] 匯出：Excel（xlsx）+ PDF 報表
- [ ] 時間區間、診所、員工維度篩選

---

### 14. 前端 TODO 收尾
**嚴重度**：🟢 功能｜**預估**：1.5 人日

**位置**：`frontend/src/views/RevenueView.vue`（7 個 TODO）+ `StaffView.vue` + `AppHeader.vue`

**行動項**：
- [ ] RevenueView：分潤記錄詳情彈窗
- [ ] RevenueView：分潤規則詳情彈窗
- [ ] RevenueView：分潤調整詳情彈窗
- [ ] StaffView：員工詳情側邊面板
- [ ] AppHeader：個人資料頁面 `/profile`
- [ ] AppHeader：設定頁面 `/settings`

---

## 🔵 P3 工程卓越（持續改進）

### 15. 測試覆蓋提升
**預估**：持續

**後端**：
- [ ] E2E 補齊：療程 session 併發完成、分潤計算完整流程、認證流程
- [ ] 覆蓋率：目前 47 spec，目標維持 90% 分支覆蓋

**前端**：
- [ ] 目前 <10% → 目標 50%+
- [ ] 優先補 Pinia stores、API services、複雜表單驗證

---

### 16. Git Hooks 與程式碼品質
**預估**：0.5 人日

- [ ] 安裝 `husky` + `lint-staged`
- [ ] pre-commit：ESLint + Prettier + TypeScript type check
- [ ] commit-msg：Conventional Commits 驗證（commitlint）
- [ ] 啟用 `.github/dependabot.yml` 週更新依賴
- [ ] CI 加入 `npm audit --audit-level=high`

---

### 17. 前端 UX 增強
**預估**：3 人日

- [ ] 深色模式實作（`style.css` 已宣告但未實裝，Naive UI `darkTheme`）
- [ ] ARIA 標籤與鍵盤導航（a11y 基礎）
- [ ] 空狀態組件（EmptyState）、骨架屏（Skeleton）
- [ ] 全域錯誤邊界（Vue `errorCaptured`）
- [ ] 行動裝置響應式優化（側邊欄抽屜化、表格橫向滾動）

---

### 18. 效能優化
**預估**：2 人日

**後端**：
- [ ] Redis 快取：分潤規則、療程樣板、診所設定（變動低）
- [ ] N+1 查詢檢查：療程列表、分潤計算
- [ ] API 回應 gzip 壓縮（`compression` middleware）
- [ ] 批量匯入分頁處理（>1000 筆）

**前端**：
- [ ] API 回應快取層（`@tanstack/vue-query` 考量）
- [ ] 路由層級 lazy loading 檢視（已部分實作）
- [ ] Lighthouse 基準：目標 Performance 90+

---

## 📊 目前專案狀態快照（2026-04-19）

| 維度 | 狀態 | 分數 |
|------|------|------|
| 後端架構 | 11 模組、24 entities、47 spec | 8/10 |
| 前端架構 | 15 views、Pinia+i18n、Playwright E2E | 7/10 |
| 文檔 | README、DEPLOYMENT、API、INTEGRATION 完整 | 8/10 |
| 部署整備 | Docker 雙環境、CI/CD、健康檢查 | 7/10 |
| 監控可觀測性 | 基本 Logger、無 APM/Sentry | 4/10 |
| 安全性 | JWT+診所隔離，缺 Helmet/Throttle/RBAC | 6/10 |
| 效能 | 前端分塊完整，後端無快取 | 5/10 |
| 業務完整度 | 核心完成，缺排程/通知/報表 | 7/10 |

**整體就緒度**：71%

---

## 🎯 建議執行節奏

| 週次 | 任務 | 目標 |
|------|------|------|
| **Week 1** | P0 #1-#4 | 生產阻塞項全部修復、可安全部署 |
| **Week 2** | P1 #5-#7 | 速率限制、日誌、Sentry 上線 |
| **Week 3** | P1 #8-#10 | Migration、併發、RBAC 完成 |
| **Week 4** | P2 #14 + P3 #16 | 前端 TODO 收尾、Git hooks |
| **Month 2** | P2 #11-#13 | 預約排程、通知渠道、報表 |
| **持續** | P3 #15, #17, #18 | 測試、UX、效能 |

---

## 📚 歷史完成記錄

### 2026-03-31（v1.0 里程碑）
- Phase 1-4 全部完成（13+3+3+4 計劃）
- Doctor Toolbox 雙向同步、衝突解決、稽核日誌
- E2E 療程工作流測試完整
- 部署文檔與 docker-compose.prod.yml 就緒

### 2026-02-11
1. ✅ 前端構建錯誤修復（vue-router 降級 4.6.4、TypeScript 類型導入、Naive UI locale）
2. ✅ 種子腳本執行成功
3. ✅ 前後端連通性驗證
4. ✅ 診所隔離機制驗證（clinicId 正確傳遞）

### 2026-02-10（前端三大頁面 API 集成）
1. ✅ TreatmentsView.vue 療程管理完整 CRUD
2. ✅ StaffView.vue 員工管理完整 CRUD
3. ✅ RevenueView.vue 分潤管理（規則/記錄/調整三模塊）
4. ✅ 診所隔離中間件（ClinicAuthMiddleware）
5. ✅ 健康檢查端點 `/api/health`
6. ✅ 種子腳本框架（scripts/seed-data.ts）
7. ✅ 端對端測試框架完善

### 2026-02-09
1. ✅ TreatmentSession CRUD API 完整實現
2. ✅ RevenueCalculatorService 完整實現（percentage/fixed/tiered）
3. ✅ 事件驅動架構：@nestjs/event-emitter + RevenueEventListener
4. ✅ 自動治療完成檢查（所有療程次數完成 → 觸發分潤計算）
5. ✅ 統一異常處理（AllExceptionsFilter + HttpExceptionFilter）
6. ✅ Swagger OpenAPI 文檔配置

---

**下一步檢查點**：
1. 啟動後端：`npm run start:dev`（確認 `JWT_SECRET` 設定）
2. 驗證 API：`curl http://localhost:3000/api/health`
3. 前端：`cd frontend && npm run dev`，用真實帳號登入
4. 執行測試：`npm run test` + `npm run test:e2e`
5. 開始 P0 #1 認證修復（建立 feature branch）
