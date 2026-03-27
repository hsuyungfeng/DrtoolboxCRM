---
phase: 01-treatment-prescription-core
plan: 08
subsystem: ui
tags: [vue3, naive-ui, typescript, treatments, progress-bar, crud]

requires:
  - phase: 01-treatment-prescription-core
    provides: TreatmentCourse CRUD API、MedicalOrder API、Patient API
provides:
  - TreatmentList.vue：療程列表頁面（醫護人員視圖，含 CRUD 操作）
  - TreatmentForm.vue：療程建立/編輯表單組件（含患者遠端搜尋）
  - TreatmentDetail.vue：療程詳情頁面（含課程列表與完成標記）
  - TreatmentProgressBar.vue：可複用療程進度條組件
  - treatments-api.ts 擴充：treatmentsApi（getTreatments/createTreatment/updateTreatment/deleteTreatment/completeSession）
affects: [01-treatment-prescription-core, 02-payment-billing, phase2-patient-portal]

tech-stack:
  added: []
  patterns:
    - "Vue 3 Composition API + TypeScript defineProps/defineEmits 強型別組件"
    - "Naive UI NDataTable + NModal 模態框 CRUD 模式"
    - "NSelect remote 搜尋整合後端患者 API"
    - "withDefaults + computed 計算屬性實現可複用進度條"

key-files:
  created:
    - frontend/src/views/TreatmentList.vue
    - frontend/src/views/TreatmentDetail.vue
    - frontend/src/components/TreatmentForm.vue
    - frontend/src/components/TreatmentProgressBar.vue
  modified:
    - frontend/src/services/treatments-api.ts

key-decisions:
  - "TreatmentProgressBar 使用 withDefaults + computed 正確計算百分比，修正計劃範本中使用 props 未解構的 bug"
  - "TreatmentList 整合至現有 TreatmentsView 模式（NMessageProvider + NDialogProvider 包裹）"
  - "treatmentsApi.completeSession 使用 PATCH 方法，與後端 session complete 端點對應"
  - "TreatmentDetail 課程完成後禁用 checkbox（不支援反向操作），確保資料一致性"

patterns-established:
  - "療程組件遵循 PatientView 模式：useMessage + useDialog + clinicId computed"
  - "表單組件使用 watch immediate:true 初始化編輯資料，emit('save') 傳遞表單物件"

requirements-completed: [COURSE-01, COURSE-02, COURSE-03, COURSE-04, COURSE-05]

duration: 2min
completed: 2026-03-27
---

# Phase 01 Plan 08: Frontend Treatment Management UI Summary

**Vue 3 療程管理 UI：TreatmentList/Form/Detail + 可複用 TreatmentProgressBar，連接後端 CRUD API**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-27T02:51:17Z
- **Completed:** 2026-03-27T02:53:58Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- 建立 TreatmentList.vue：表格顯示療程列表，支持新增/編輯/刪除，整合對話框表單
- 建立 TreatmentForm.vue：響應式表單，含遠端患者搜尋（NSelect remote mode）和必填驗證
- 建立 TreatmentProgressBar.vue：可複用進度條，使用 withDefaults + computed 正確計算百分比
- 建立 TreatmentDetail.vue：療程詳情頁，含課程列表、完成標記（不可逆）和進度視覺化
- 擴充 treatments-api.ts：新增 treatmentsApi 物件，提供完整 CRUD + completeSession 方法

## Task Commits

1. **任務 1：建立 TreatmentList 和 TreatmentForm 組件** - `9ab8645f` (feat)
2. **任務 2：建立 TreatmentDetail 和 TreatmentProgressBar** - `7e0a8f5a` (feat)

## Files Created/Modified

- `frontend/src/views/TreatmentList.vue` - 療程列表頁（醫護人員），含 CRUD 操作和模態框
- `frontend/src/views/TreatmentDetail.vue` - 療程詳情頁，含進度條和課程完成標記
- `frontend/src/components/TreatmentForm.vue` - 療程建立/編輯表單，含患者遠端搜尋
- `frontend/src/components/TreatmentProgressBar.vue` - 可複用進度條組件
- `frontend/src/services/treatments-api.ts` - 新增 treatmentsApi CRUD 方法

## Decisions Made

- `TreatmentProgressBar` 使用 `withDefaults` 取代計劃範本中錯誤的 `defineProps + computed` 寫法（未引入 `computed`），避免 runtime 錯誤
- 課程完成後 checkbox 設為 disabled（不支援取消完成），確保療程進度資料單向遞增
- `treatmentsApi.completeSession` 使用 PATCH `/treatments/sessions/:id/complete`，與後端 REST 慣例一致
- TreatmentList 沿用現有 PatientView 組件架構（`NMessageProvider` + `NDialogProvider` + `useDialog`）

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 修正 TreatmentProgressBar computed 未引入 computed 的 bug**

- **Found during:** Task 2（建立 TreatmentProgressBar.vue）
- **Issue:** 計劃範本中 `progressPercent = computed(...)` 未引入 `computed`，且使用 `completed.value`/`total.value` 但 props 並非 ref
- **Fix:** 使用 `import { computed } from 'vue'`，透過 `props.completed`/`props.total` 存取，並改用 `withDefaults` 設定預設值
- **Files modified:** frontend/src/components/TreatmentProgressBar.vue
- **Verification:** 組件語法正確，computed 邏輯可正常執行
- **Committed in:** 7e0a8f5a（Task 2 commit）

---

**Total deviations:** 1 auto-fixed（1 bug fix）
**Impact on plan:** 修正必要的語法 bug，無超出範圍的變更。

## Issues Encountered

無其他問題。所有功能按計劃實作完成。

## Next Phase Readiness

- 前端療程管理 UI 已完成，可進行視覺驗證和端對端整合測試
- 需在 Vue Router 中註冊 `TreatmentList`（`/treatments`）和 `TreatmentDetail`（`/treatments/:id`）路由
- 後端 `GET /treatments/courses` 需支援 `clinicId` query 參數篩選

---
*Phase: 01-treatment-prescription-core*
*Completed: 2026-03-27*
