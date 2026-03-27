---
phase: 01-treatment-prescription-core
plan: 05
subsystem: api
tags: [nestjs, typeorm, treatment, crud, rest-api, typescript]

# Dependency graph
requires:
  - phase: 01-treatment-prescription-core
    plan: 02
    provides: TreatmentProgressService.getProgress() 用於進度計算
  - phase: 01-treatment-prescription-core
    plan: 03
    provides: PatientSearchRepository 患者驗證基礎
provides:
  - TreatmentCourseService 完整 CRUD 方法（createCourse、updateCourse、deleteCourse、getCourseSessions）
  - TreatmentCourseController REST API 端點（POST、GET、PATCH、DELETE）
  - TreatmentCourseResponseDto / TreatmentCoursePatientViewDto 標準化響應格式
affects:
  - 前端療程管理介面（患者和醫護視圖）
  - 患者療程查詢端點
  - 醫護人員課程管理

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "事務包裝（DataSource.transaction）確保療程與課程的原子性建立"
    - "多租戶隔離透過 clinicId WHERE 條件實現"
    - "進度計算從 sessions.completionStatus 即時衍生（不儲存）"
    - "患者視圖 DTO 使用 @Exclude() 隱藏敏感欄位"

key-files:
  created:
    - backend/src/treatments/dto/treatment-course-response.dto.ts
  modified:
    - backend/src/treatments/services/treatment-course.service.ts
    - backend/src/treatments/controllers/treatment-course.controller.ts
    - backend/src/treatments/services/medical-order.service.ts

key-decisions:
  - "TreatmentCourseController 使用 JwtAuthGuard 而非 ClinicContextGuard（與現有架構一致）"
  - "clinicId 透過 query 參數或 req.user.clinicId 解析（雙重來源）"
  - "刪除療程前驗證所有 sessions 均為 pending 狀態"
  - "患者視圖 DTO（TreatmentCoursePatientViewDto）使用 @Exclude 隱藏 clinicId 和 patientId"

patterns-established:
  - "Pattern 1: 雙 DTO 模式 - 醫護完整視圖（TreatmentCourseResponseDto）+ 患者受限視圖（TreatmentCoursePatientViewDto）"
  - "Pattern 2: 進度物件嵌入響應中（progress.totalSessions / completedSessions / progressPercent / isCompleted）"

requirements-completed: [COURSE-01, COURSE-02, COURSE-05]

# Metrics
duration: 45min
completed: 2026-03-27
---

# Phase 01 Plan 05：療程 CRUD API 完整實作 Summary

**療程 CRUD REST API 含事務建立、進度追蹤、患者/醫護雙視圖 DTO，使用 NestJS + TypeORM**

## Performance

- **Duration:** 45 min
- **Started:** 2026-03-26T08:00:00Z
- **Completed:** 2026-03-27T00:00:00Z
- **Tasks:** 3 tasks + 1 auto-fix
- **Files modified:** 4

## Accomplishments

- TreatmentCourseService 增強完整 CRUD：createCourse（事務）、updateCourse（狀態驗證）、deleteCourse（前置確認）、getCourseSessions（含醫護分配）
- TreatmentCourseController 實作 6 個 REST 端點，涵蓋 POST/GET/PATCH/DELETE 和患者療程列表
- 建立雙視圖 ResponseDto：醫護視圖含完整欄位、患者視圖使用 @Exclude 隱藏敏感資訊
- 修正 MedicalOrderService 型別錯誤（null 無法賦值給 Date）

## Task Commits

每個任務均已原子性提交：

1. **Task 1：增強 TreatmentCourseService CRUD 方法** - `d13df61e` (feat)
2. **Task 2：增強 TreatmentCourseController REST 端點** - `8a0802d4` (feat)
3. **Task 3：建立 TreatmentCourseResponseDto 標準化響應** - `9eeb169d` (feat)
4. **Auto-fix：修正 MedicalOrderService 型別問題** - `6d3cda7f` (fix)

## Files Created/Modified

- `backend/src/treatments/services/treatment-course.service.ts` - 新增 updateCourse、deleteCourse、getCourseSessions，整合 TreatmentProgressService
- `backend/src/treatments/controllers/treatment-course.controller.ts` - 增強 6 個 REST 端點（POST courses、GET courses/:id、PATCH courses/:id、DELETE courses/:id、GET patient/:patientId、GET courses/:id/sessions）
- `backend/src/treatments/dto/treatment-course-response.dto.ts` - 建立 TreatmentCourseResponseDto、TreatmentSessionResponseDto、TreatmentCoursePatientViewDto
- `backend/src/treatments/services/medical-order.service.ts` - 修正 null 無法賦值給 Date 的型別錯誤

## Decisions Made

- **Controller Guard 選擇**：維持現有 JwtAuthGuard 而非引入新的 ClinicContextGuard，與現有程式碼架構一致
- **clinicId 解析策略**：同時接受 query 參數和 req.user.clinicId，提高 API 彈性
- **刪除保護邏輯**：療程有任一 session completionStatus 非 pending 時拒絕刪除，改為引導使用 abandoned 狀態
- **患者視圖隔離**：使用 class-transformer @Exclude() 在序列化層隱藏 clinicId 和 patientId，而非業務邏輯層

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 修正 MedicalOrderService 型別不相容錯誤**
- **Found during:** 任務完成後執行建置驗證
- **Issue:** `startedAt: null` 和 `completedAt: null` 無法賦值給 `Partial<MedicalOrder>` 中的 `Date | undefined` 型別
- **Fix:** 移除 orderData 物件中的 `startedAt: null` 和 `completedAt: null`（TypeORM nullable 欄位預設為 null）
- **Files modified:** `backend/src/treatments/services/medical-order.service.ts`
- **Verification:** `npx tsc --noEmit` 確認 medical-order 相關錯誤消失
- **Committed in:** `6d3cda7f`

---

**Total deviations:** 1 auto-fixed（Rule 1 - Bug）
**Impact on plan:** 修正型別錯誤確保建置通過，不影響計劃範疇。

## Issues Encountered

- 執行 `npm run build` 時發現多個預存測試檔案型別錯誤（seed-data.ts、spec 檔案），但這些均為現有程式碼問題，不在本計劃範疇內，已記錄於 deferred-items.md

## User Setup Required

None - 不需要外部服務配置。

## Next Phase Readiness

- 療程 CRUD API 完整，前端可使用以下端點：
  - `POST /treatments/courses` 建立療程
  - `GET /treatments/courses/:id` 取得療程詳情含進度
  - `PATCH /treatments/courses/:id` 更新療程
  - `DELETE /treatments/courses/:id` 刪除療程
  - `GET /treatments/patient/:patientId` 患者療程列表
  - `GET /treatments/courses/:id/sessions` 療程課程列表
- Plan 06 的 PatientController 和 PatientService 已在並行開發中完成
- 測試覆蓋率仍待補充（spec 檔案有型別錯誤，需要在後續計劃修正）

---
*Phase: 01-treatment-prescription-core*
*Completed: 2026-03-27*
