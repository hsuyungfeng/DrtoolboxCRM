---
phase: 03-financial-management-enhancement
plan: "03"
subsystem: api, ui
tags: [echarts, vue-echarts, pinia, typeorm, decimal.js, nestjs, revenue-report]

requires:
  - phase: 03-financial-management-enhancement
    plan: "01"
    provides: Payment 實體與 PaymentService（Payment 資料來源）
  - phase: 03-financial-management-enhancement
    plan: "02"
    provides: InvoiceService（財務模組基礎架構）

provides:
  - RevenueReportService：四個聚合查詢方法（getRevenueSummary / getMonthlyTrend / getPaymentMethodBreakdown / getStaffRevenue）
  - RevenueReportController：4 個 GET 端點（/revenue-reports/summary / monthly-trend / payment-methods / staff），JwtAuthGuard 保護
  - revenue-api.ts：前端完整 API 服務（paymentApi / invoiceApi / reportApi 三類）
  - revenue.store.ts：Pinia store，ECharts 月趨勢長條圖與支付方式環形圖計算屬性
  - RevenueView.vue：新增「收入報表」分頁，含日期範圍選擇、統計卡片、ECharts 圖表、人員分潤表

affects:
  - frontend-dashboard
  - phase-04

tech-stack:
  added:
    - vue-echarts 8.0.1（ECharts Vue 元件，透過 use() 按需載入）
    - echarts 6.0.0（BarChart、PieChart、CanvasRenderer）
    - decimal.js（後端金額精度計算）
  patterns:
    - 後端聚合查詢使用 TypeORM QueryBuilder + Decimal.js 精度計算
    - 前端 Pinia store 的 computed 屬性直接輸出 ECharts option 物件
    - ECharts 元件以 use() 按需載入（BarChart、PieChart、GridComponent 等）
    - 日期範圍正規化（normalizeDateRange）預設當月 1 號到月底

key-files:
  created:
    - backend/src/revenue/services/revenue-report.service.ts
    - backend/src/revenue/services/revenue-report.service.spec.ts
    - backend/src/revenue/controllers/revenue-report.controller.ts
    - frontend/src/services/revenue-api.ts
    - frontend/src/stores/revenue.store.ts
  modified:
    - backend/src/revenue/revenue.module.ts
    - frontend/src/views/RevenueView.vue

key-decisions:
  - "RevenueReportService 以 @InjectRepository(Staff) 直接注入 Staff repo，避免跨模組依賴 StaffService"
  - "getMonthlyTrend 使用 SQLite strftime('%Y-%m', paidAt) 群組，確保 SQLite 相容性"
  - "revenue.store.ts 的 loadReportData 使用 Promise.all 並行請求四個端點，最大化效能"
  - "RevenueView.vue 的報表分頁在 onTabChange 事件中懶載入，避免初始頁面載入時的不必要請求"
  - "ECharts 元件以 use() 按需載入，不使用全量引入，減少 bundle 大小"

patterns-established:
  - "ECharts-in-Pinia：computed 屬性回傳完整 ECharts option，View 層直接綁定 :option，無需 watch"
  - "後端報表服務模式：normalizeDateRange 私有方法統一處理日期預設值，各公開方法保持簡潔"
  - "前端 API 服務分類：同檔案按業務域分組（paymentApi / invoiceApi / reportApi），便於 import"

requirements-completed:
  - FIN-06

duration: 25min
completed: 2026-03-30
---

# Phase 3 Plan 03：財務報表視覺化 Summary

**以 TypeORM QueryBuilder + Decimal.js 聚合收入數據，提供 4 個 REST API 端點，前端使用 ECharts 長條圖＋環形圖展示月收入趨勢與支付方式分布**

## Performance

- **Duration:** 25 min
- **Started:** 2026-03-30T09:00:00Z
- **Completed:** 2026-03-30T09:25:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- 後端 RevenueReportService 完成 4 個聚合查詢方法，5 項單元測試全部通過，Decimal.js 精度計算確保金額準確
- 前端 revenue-api.ts 提供 paymentApi / invoiceApi / reportApi 三類 API，revenue.store.ts 以 Pinia 管理狀態並輸出 ECharts 圖表設定
- RevenueView.vue 新增「收入報表」分頁：日期範圍選擇器、統計卡片（總收入/付款筆數/平均金額）、月收入長條圖、支付方式環形圖、醫護人員分潤表

## Task Commits

1. **Task 1: RevenueReportService 與 RevenueReportController** — `29a50bee` (feat)
2. **Task 2: 前端 revenue-api.ts、revenue.store.ts 與 RevenueView.vue 報表分頁** — `cea4d16d` (feat)

## Files Created/Modified

- `backend/src/revenue/services/revenue-report.service.ts` — 收入報表聚合服務（4 個查詢方法，Decimal.js 精度）
- `backend/src/revenue/services/revenue-report.service.spec.ts` — 5 項單元測試（mock QueryBuilder）
- `backend/src/revenue/controllers/revenue-report.controller.ts` — 4 個 GET 端點，JwtAuthGuard 保護
- `backend/src/revenue/revenue.module.ts` — 加入 RevenueReportService 與 RevenueReportController
- `frontend/src/services/revenue-api.ts` — paymentApi / invoiceApi / reportApi 前端 API 服務
- `frontend/src/stores/revenue.store.ts` — Pinia store，含 ECharts chartOption computed 屬性
- `frontend/src/views/RevenueView.vue` — 新增報表分頁（ECharts 長條圖＋環形圖＋統計卡片＋人員分潤表）

## Decisions Made

- `getMonthlyTrend` 使用 SQLite `strftime('%Y-%m', paidAt)` 群組，確保與現有 SQLite 資料庫相容
- Pinia store 的 `computed` 屬性直接回傳完整 ECharts option，View 層無需額外轉換
- 報表分頁採懶載入（`onTabChange`），首次切換到「收入報表」分頁才觸發 API 請求
- ECharts 元件使用 `use()` 按需載入（BarChart、PieChart 等），不使用全量引入

## Deviations from Plan

無 — 計劃完全按預期執行。

## Issues Encountered

pre-existing TypeScript 測試錯誤存在於 `src/tests/` 目錄（medical-orders.spec.ts、patients.spec.ts、treatments.spec.ts 等），均與本計劃修改無關，已記錄為 deferred 範疇外問題。Vite build 本身零錯誤通過。

## User Setup Required

無 — 不需外部服務設定。

## Next Phase Readiness

- Phase 3 全部計劃完成（03-01 患者支付、03-02 發票系統、03-03 財務報表）
- ECharts 視覺化元件已在 RevenueView.vue 整合完畢，可作為 Phase 4 圖表開發範本
- 前端 revenue-api.ts 已覆蓋 payment / invoice / report 三類 API，後端服務齊備

---
*Phase: 03-financial-management-enhancement*
*Completed: 2026-03-30*
