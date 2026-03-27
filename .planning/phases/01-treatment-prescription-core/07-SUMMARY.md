---
phase: 01-treatment-prescription-core
plan: 07
subsystem: api
tags: [class-validator, nestjs, exception-filter, dto, validation]

# Dependency graph
requires:
  - phase: 01-treatment-prescription-core
    provides: MedicalOrder DTO 結構與患者 DTO 結構（計劃 01、03）
provides:
  - VALIDATION_RULES 集中驗證常數（醫令、療程、患者）
  - validateMedicalOrder / validateTreatmentCourse / validatePatient 輔助函數
  - ValidationErrorFilter 全域 BadRequestException 攔截器（含時間戳、路徑）
  - patient-validators.ts 患者驗證輔助模組
affects:
  - 所有後續計劃（04-13）：所有 API 端點均受 ValidationErrorFilter 保護

# Tech tracking
tech-stack:
  added: []
  patterns:
    - VALIDATION_RULES 常數集中定義，單一修改點
    - ExceptionFilter 實作 BadRequestException 統一格式化
    - 驗證函數以純函數形式提供，獨立於 NestJS 生命週期

key-files:
  created:
    - backend/src/treatments/dto/dto-validators.ts
    - backend/src/patients/dto/patient-validators.ts
    - backend/src/common/filters/validation-error.filter.ts
  modified:
    - backend/src/main.ts

key-decisions:
  - "ValidationErrorFilter 在 main.ts 中優先註冊，確保驗證錯誤在 HttpExceptionFilter 之前攔截"
  - "VALIDATION_RULES 使用中文鍵名與英文備註，與 DTO 欄位命名方針一致"
  - "patient-validators.ts 重新匯出自 dto-validators.ts，避免重複定義，保持單一來源"

patterns-established:
  - "驗證規則集中定義：所有常數置於 VALIDATION_RULES，修改只需更改一處"
  - "ValidationErrorFilter 格式：statusCode + message（; 分隔）+ errors[]（多錯誤時）+ timestamp + path"

requirements-completed: []

# Metrics
duration: 5min
completed: 2026-03-26
---

# Phase 01 Plan 07：DTO 驗證層與 ValidationErrorFilter 摘要

**集中 DTO 驗證規則常數（VALIDATION_RULES）與全域 BadRequestException 過濾器，統一所有端點的驗證錯誤格式**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-26T09:03:48Z
- **Completed:** 2026-03-26T09:09:00Z
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments

- 建立 `VALIDATION_RULES` 常數，集中定義醫令、療程、患者的所有欄位長度與格式限制
- 實作 `validateMedicalOrder`、`validateTreatmentCourse`、`validatePatient` 純函數驗證器
- 建立 `ValidationErrorFilter` 實作 NestJS `ExceptionFilter`，統一格式化驗證錯誤（含時間戳、路徑）
- 在 `main.ts` 全域註冊 `ValidationErrorFilter`，所有端點一致受保護

## Task Commits

每個任務以原子提交方式完成：

1. **任務 1：建立統一驗證規則和 ValidationErrorFilter** - `00b37172` (feat)

**Plan metadata:** 待建立 (docs)

## Files Created/Modified

- `backend/src/treatments/dto/dto-validators.ts` - VALIDATION_RULES 常數與三個純函數驗證器
- `backend/src/patients/dto/patient-validators.ts` - 患者驗證輔助模組（重新匯出共用驗證規則）
- `backend/src/common/filters/validation-error.filter.ts` - ValidationErrorFilter 全域過濾器實作
- `backend/src/main.ts` - 新增 ValidationErrorFilter 全域註冊

## Decisions Made

- ValidationErrorFilter 優先於 HttpExceptionFilter 註冊，確保驗證錯誤以標準格式回應
- VALIDATION_RULES 使用中文鍵名，與系統既有中文 JSDoc 文件風格一致
- patient-validators.ts 作為轉接模組，重新匯出 dto-validators.ts 的函數，保持單一來源

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

發現後端存在 8 個預先存在的 TypeScript 建構錯誤（與計劃 07 變更無關）：

- `patient.controller.ts`：PatientService 缺少 `createPatient`、`updatePatient` 方法
- `treatment.entity.ts`：Patient 實體缺少 `treatments` 屬性
- `medical-order.service.ts`：MedicalOrder 建構類型不符

已記錄於 `deferred-items.md`，這些問題屬於計劃 04-06 範疇，不影響本計劃的驗證功能。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 驗證層已就緒，所有後續端點計劃（04-13）均可使用 VALIDATION_RULES 常數
- ValidationErrorFilter 全域生效，新增端點自動受驗證錯誤保護
- 尚有 8 個預先存在的建構錯誤需在後續計劃中修復

---
*Phase: 01-treatment-prescription-core*
*Completed: 2026-03-26*
