---
phase: 01-treatment-prescription-core
plan: 12
subsystem: testing
tags: [vitest, vue-test-utils, jsdom, vue3, pinia, unit-tests, frontend]

# Dependency graph
requires:
  - phase: 01-treatment-prescription-core
    provides: MedicalOrderForm、TreatmentForm、TreatmentProgressBar 組件及 medicalOrdersApi、treatmentsApi、patientsApi 服務層

provides:
  - 前端 Vue 組件單元測試（MedicalOrderForm、TreatmentForm、TreatmentProgressBar）
  - API 服務層模擬測試（medicalOrdersApi、treatmentsApi、patientsApi）
  - 患者醫令整合測試
  - Vitest 測試框架配置（jsdom 環境）

affects: [02-feature-development, phase-2, phase-3]

# Tech tracking
tech-stack:
  added:
    - vitest@4.1.2（Vue3 測試框架）
    - "@vue/test-utils@2.4.6"（Vue 組件測試工具）
    - jsdom@29.0.1（DOM 環境模擬）
    - "@vitest/coverage-v8@4.1.2"（覆蓋率報告）
  patterns:
    - vi.mock 模擬 API 服務（避免真實 HTTP 請求）
    - setActivePinia(createPinia()) 在 beforeEach 初始化 Pinia
    - vi.clearAllMocks() 在 beforeEach 清除模擬狀態
    - global.stubs 樁接 Naive UI 組件避免 CSS 渲染問題

key-files:
  created:
    - frontend/src/tests/medical-orders.spec.ts
    - frontend/src/tests/treatments.spec.ts
    - frontend/src/tests/patients.spec.ts
  modified:
    - frontend/package.json（新增 test:unit 腳本與測試依賴）
    - frontend/vite.config.ts（新增 vitest 設定：jsdom 環境、覆蓋率）

key-decisions:
  - "測試檔放置於 frontend/src/tests/ 而非 frontend/tests/（避免與 Playwright e2e 混淆）"
  - "useUserStore mock 加入 user: { id, name, role } 支援 PatientMedicalOrderView 的 userStore.user?.id 存取"
  - "所有 API 測試採用 vi.mocked(api.method).mockResolvedValue() 模式，不依賴實際 HTTP"
  - "TreatmentProgressBar 以 computed progressPercent 計算測試，直接斷言 wrapper.vm.progressPercent"

patterns-established:
  - "前端單元測試模式：vi.mock API → setActivePinia → mount with stubs → 斷言行為"
  - "API mock 回傳值直接是資料（非 { data: ... }），因為 api.ts 攔截器已解包 response.data.data"

requirements-completed: []

# Metrics
duration: 15min
completed: 2026-03-27
---

# Phase 01 Plan 12: 前端 Vue 組件與 API 單元測試 Summary

**使用 Vitest + @vue/test-utils 建立 33 項前端單元測試，覆蓋 MedicalOrderForm、TreatmentProgressBar 組件及全部 API 服務層**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-27T11:00:00Z
- **Completed:** 2026-03-27T11:16:37Z
- **Tasks:** 1
- **Files modified:** 5

## Accomplishments

- 建立 3 個測試檔共 33 項測試，全部通過
- 安裝並設定 Vitest 測試框架（jsdom 環境）
- 完整模擬 medicalOrdersApi、treatmentsApi、patientsApi API 服務
- TreatmentProgressBar 進度百分比計算邊界條件測試（0%、30%、50%、100%）
- MedicalOrderForm / TreatmentForm 組件掛載與 props 初始化測試
- PatientMedicalOrderView 動態 import 掛載測試

## Task Commits

1. **Task 1: 建立前端組件和 API 測試** - `227e6c53` (feat)

**Plan metadata:** TBD (docs commit)

## Files Created/Modified

- `frontend/src/tests/medical-orders.spec.ts` - MedicalOrderForm 組件測試 + medicalOrdersApi 6 項 API 操作測試
- `frontend/src/tests/treatments.spec.ts` - TreatmentForm + TreatmentProgressBar 組件測試 + treatmentsApi 5 項 API 操作測試
- `frontend/src/tests/patients.spec.ts` - patientsApi 6 項 CRUD 測試 + 患者醫令整合測試 + PatientMedicalOrderView 掛載測試
- `frontend/package.json` - 新增 test:unit / test:unit:watch 腳本及 vitest、@vue/test-utils、jsdom、@vitest/coverage-v8 依賴
- `frontend/vite.config.ts` - 新增 vitest 設定區塊（jsdom 環境、覆蓋率 v8）

## Decisions Made

- 測試檔放置於 `frontend/src/tests/`（區別於 Playwright e2e 的 `frontend/tests/`）
- `useUserStore` mock 加入 `user` 屬性，支援 `PatientMedicalOrderView` 的用戶 ID 存取
- API mock 回傳值採直接資料格式（非 `{ data: ... }`），對應 `api.ts` 攔截器自動解包行為
- `TreatmentProgressBar.progressPercent` 使用 `computed` 暴露至 `wrapper.vm`，便於斷言測試

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] 安裝 Vitest 測試框架及相關依賴**
- **Found during:** Task 1（建立前端組件和 API 測試）
- **Issue:** package.json 無 vitest、@vue/test-utils 依賴，亦無 test:unit 腳本
- **Fix:** 安裝 vitest、@vue/test-utils、jsdom、@vitest/coverage-v8；設定 vite.config.ts；新增 package.json 腳本
- **Files modified:** frontend/package.json、frontend/vite.config.ts
- **Verification:** npm run test:unit 成功執行 33 項測試
- **Committed in:** 227e6c53（Task 1 commit）

---

**Total deviations:** 1 auto-fixed（1 blocking）
**Impact on plan:** 測試框架安裝為執行任何前端測試的必要前提，非範圍擴展。

## Issues Encountered

- `PatientMedicalOrderView.vue` 存取 `userStore.user?.id`，但計劃提供的 mock 未包含 `user` 屬性 → 已在 patients.spec.ts 中更新 mock

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 1 全部 13 個計劃完成，前後端核心功能及測試均就緒
- Phase 2 可進行更進階的 E2E 測試或功能擴充
- 建議後續新增 Pinia store 層的單元測試（如 useUserStore 行為測試）

---
*Phase: 01-treatment-prescription-core*
*Completed: 2026-03-27*
