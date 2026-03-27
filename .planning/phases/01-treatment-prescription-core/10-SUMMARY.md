---
phase: 01-treatment-prescription-core
plan: 10
subsystem: ui
tags: [vue3, naive-ui, patient-dashboard, treatment, medical-order]

requires:
  - phase: 01-03
    provides: PatientSearch 實體與搜尋服務（patientId 來源）
  - phase: 01-06
    provides: PatientController REST API（GET /patients/:id/medical-orders）

provides:
  - PatientDashboard.vue：患者儀表板頁面（/patient-dashboard 路由）
  - PatientTreatmentView.vue：唯讀療程列表組件，含進度條
  - PatientMedicalOrderView.vue：唯讀醫令列表組件，含狀態標籤與使用進度條

affects:
  - 後續患者側功能（通知、費用查詢）

tech-stack:
  added: []
  patterns:
    - 患者視圖組件唯讀設計（無新增/編輯/刪除操作）
    - 以 n-spin + n-empty 處理載入與空狀態
    - 狀態映射函式（getStatusType / getStatusLabel）與進度計算函式集中於組件內

key-files:
  created:
    - frontend/src/views/PatientDashboard.vue
    - frontend/src/components/PatientTreatmentView.vue
    - frontend/src/components/PatientMedicalOrderView.vue
  modified:
    - frontend/src/router/index.ts

key-decisions:
  - "PatientTreatmentView 使用 treatmentsApi.getTreatments({ patientId }) 而非規劃中的 /api/patients/me/treatments，與現有 API 服務層一致"
  - "PatientMedicalOrderView 使用 medicalOrdersApi.getPatientOrders(patientId)，英文欄位名與後端 MedicalOrder DTO 一致"
  - "進度百分比優先讀取 progress.progressPercent，降級計算 completedSessions/totalSessions，確保向後相容"
  - "PatientDashboard 加入 /patient-dashboard 路由，與現有 router/index.ts 結構一致"

patterns-established:
  - "唯讀患者視圖：無操作按鈕，只顯示進度與狀態"
  - "n-progress + n-tag 組合呈現進度與狀態"

requirements-completed: [COURSE-05, PATIENT-03]

duration: 3min
completed: 2026-03-27
---

# Phase 01 Plan 10：患者儀表板 Summary

**以 Naive UI 標籤頁實作患者端儀表板，含療程進度條（n-progress）與醫令狀態標籤（n-tag），資料來自現有 treatments-api / medical-orders-api 服務層**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-27T02:41:39Z
- **Completed:** 2026-03-27T02:44:00Z
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments

- PatientDashboard.vue 完成，提供 /patient-dashboard 路由，標籤頁切換療程與醫令
- PatientTreatmentView.vue 完成，唯讀卡片式療程列表，支援進度條與狀態標籤
- PatientMedicalOrderView.vue 完成，唯讀卡片式醫令列表，支援使用進度條與狀態標籤

## Task Commits

每個任務均原子提交：

1. **任務 1：建立 PatientDashboard 和相關組件** - `7e5b246b` (feat)

## Files Created/Modified

- `frontend/src/views/PatientDashboard.vue` — 患者儀表板頁面，n-tabs 切換療程/醫令
- `frontend/src/components/PatientTreatmentView.vue` — 療程卡片列表，n-progress 進度條
- `frontend/src/components/PatientMedicalOrderView.vue` — 醫令卡片列表，n-tag 狀態與 n-progress 使用進度
- `frontend/src/router/index.ts` — 新增 /patient-dashboard 路由

## Decisions Made

- 使用 `treatmentsApi.getTreatments({ patientId })` 而非計劃中的 `/api/patients/me/treatments`，符合現有 API 服務層結構，避免新增未實作端點
- 模板中計劃使用的中文屬性名（`order.藥物或治療名稱` 等）更正為英文欄位名（`order.drugOrTreatmentName`），與後端 DTO 及 API 型別一致
- 進度百分比計算加入防零除保護（`totalSessions === 0` 時返回 0）

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 修正 PatientMedicalOrderView 模板中的中文屬性名**
- **Found during:** 任務 1
- **Issue:** 計劃模板使用 `order.藥物或治療名稱`、`order.劑量`、`order.使用方式` 等中文屬性名，但後端 DTO 及 API 型別為英文（`drugOrTreatmentName`、`dosage`、`usageMethod`）
- **Fix:** 將所有模板屬性名更新為英文欄位名，與 `MedicalOrder` 介面一致
- **Files modified:** frontend/src/components/PatientMedicalOrderView.vue
- **Verification:** 欄位名與 medical-orders-api.ts 的 MedicalOrder 介面一致
- **Committed in:** 7e5b246b

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** 必要更正，確保模板能正確綁定 API 響應資料。無範疇擴增。

## Issues Encountered

無

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 患者儀表板組件已完成，可供後續 Phase 2 患者通知、費用查詢等功能擴充
- /patient-dashboard 路由已就緒，可加入導覽選單
- PatientTreatmentView / PatientMedicalOrderView 可作為基礎組件進一步擴充（如篩選、搜尋）

---
*Phase: 01-treatment-prescription-core*
*Completed: 2026-03-27*

## Self-Check: PASSED

- frontend/src/views/PatientDashboard.vue: FOUND
- frontend/src/components/PatientTreatmentView.vue: FOUND
- frontend/src/components/PatientMedicalOrderView.vue: FOUND
- .planning/phases/01-treatment-prescription-core/10-SUMMARY.md: FOUND
- commit 7e5b246b: FOUND
